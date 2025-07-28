import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';

const grepSearchConfigSchema = z.object({
  path: z.string().describe('File or directory path to search'),
  pattern: z.string().describe('Search pattern'),
  recursive: z.boolean().optional().describe('Recursive search (-r)'),
  ignoreCase: z.boolean().optional().describe('Case-insensitive search (-i)'),
  invertMatch: z.boolean().optional().describe('Invert matches (-v)'),
  lineNumbers: z.boolean().optional().describe('Show line numbers (-n)'),
  wordMatch: z.boolean().optional().describe('Match whole words only (-w)'),
  fixedStrings: z.boolean().optional().describe('Treat pattern as fixed string (-F)'),
  maxCount: z.number().optional().describe('Maximum number of matches (-m)'),
});

const grepSearchInputSchema = z.object({
  searches: z.array(grepSearchConfigSchema).min(1).describe('Array of search configurations'),
});

const grepMatchSchema = z.object({
  file: z.string().describe('File path where match was found'),
  lineNumber: z.number().optional().describe('Line number of the match'),
  content: z.string().describe('Matched line content'),
});

const grepSearchResultSchema = z.object({
  path: z.string().describe('Search path'),
  pattern: z.string().describe('Search pattern'),
  matches: z.array(grepMatchSchema).describe('Array of matches found'),
  matchCount: z.number().describe('Total number of matches'),
});

const grepSearchFailureSchema = z.object({
  path: z.string().describe('Search path that failed'),
  pattern: z.string().describe('Search pattern'),
  error: z.string().describe('Error message'),
});

const grepSearchOutputSchema = z.object({
  message: z.string().describe('Summary message'),
  duration: z.number().describe('Duration of operation in milliseconds'),
  successful_searches: z.array(grepSearchResultSchema).describe('Successful searches with matches'),
  failed_searches: z.array(grepSearchFailureSchema).describe('Failed searches with error messages'),
});

export type GrepSearchConfig = {
  path: string;
  pattern: string;
  recursive?: boolean;
  ignoreCase?: boolean;
  invertMatch?: boolean;
  lineNumbers?: boolean;
  wordMatch?: boolean;
  fixedStrings?: boolean;
  maxCount?: number;
};
export type GrepSearchInput = z.infer<typeof grepSearchInputSchema>;
export type GrepSearchOutput = z.infer<typeof grepSearchOutputSchema>;

const grepSearchExecution = wrapTraced(
  async (
    params: z.infer<typeof grepSearchInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof grepSearchOutputSchema>> => {
    const { searches: rawSearches } = params;

    // Apply defaults to searches
    const searches = rawSearches.map((search) => ({
      path: search.path,
      pattern: search.pattern,
      recursive: search.recursive ?? false,
      ignoreCase: search.ignoreCase ?? false,
      invertMatch: search.invertMatch ?? false,
      lineNumbers: search.lineNumbers ?? true,
      wordMatch: search.wordMatch ?? false,
      fixedStrings: search.fixedStrings ?? false,
      ...(search.maxCount !== undefined && { maxCount: search.maxCount }),
    }));
    const startTime = Date.now();

    if (!rawSearches || rawSearches.length === 0) {
      return {
        message: 'No searches provided',
        duration: Date.now() - startTime,
        successful_searches: [],
        failed_searches: [],
      };
    }

    try {
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (sandbox) {
        // Read the grep-search-script.ts content
        const scriptPath = path.join(__dirname, 'grep-search-script.ts');
        const scriptContent = await fs.readFile(scriptPath, 'utf-8');

        // Build command line arguments
        // The script expects a JSON array of searches as the first argument
        const args = [JSON.stringify(searches)];

        const result = await runTypescript(sandbox, scriptContent, { argv: args });

        if (result.exitCode !== 0) {
          console.error('Sandbox execution failed. Exit code:', result.exitCode);
          console.error('Stderr:', result.stderr);
          console.error('Result:', result.result);
          throw new Error(`Sandbox execution failed: ${result.stderr || 'Unknown error'}`);
        }

        let grepResults: Array<{
          success: boolean;
          path: string;
          pattern: string;
          matches?: Array<{ file: string; lineNumber?: number; content: string }>;
          matchCount?: number;
          error?: string;
        }>;
        try {
          grepResults = JSON.parse(result.result.trim());
        } catch (parseError) {
          console.error('Failed to parse sandbox output:', result.result);
          throw new Error(
            `Failed to parse sandbox output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
          );
        }

        const successfulSearches: z.infer<typeof grepSearchResultSchema>[] = [];
        const failedSearches: z.infer<typeof grepSearchFailureSchema>[] = [];

        for (const searchResult of grepResults) {
          if (searchResult.success) {
            successfulSearches.push({
              path: searchResult.path,
              pattern: searchResult.pattern,
              matches: searchResult.matches || [],
              matchCount: searchResult.matchCount || 0,
            });
          } else {
            failedSearches.push({
              path: searchResult.path,
              pattern: searchResult.pattern,
              error: searchResult.error || 'Unknown error',
            });
          }
        }

        return {
          message: `Completed ${successfulSearches.length} searches successfully, ${failedSearches.length} failed`,
          duration: Date.now() - startTime,
          successful_searches: successfulSearches,
          failed_searches: failedSearches,
        };
      }

      // When not in sandbox, we can't use the grep command
      // Return an error for each search
      return {
        message: 'Grep searches require sandbox environment',
        duration: Date.now() - startTime,
        successful_searches: [],
        failed_searches: searches.map((search) => ({
          path: search.path,
          pattern: search.pattern,
          error: 'grep command requires sandbox environment',
        })),
      };
    } catch (error) {
      return {
        message: 'Execution error occurred',
        duration: Date.now() - startTime,
        successful_searches: [],
        failed_searches: searches.map((search) => ({
          path: search.path,
          pattern: search.pattern,
          error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'grep-search' }
);

export const grepSearch = createTool({
  id: 'grep_search',
  description:
    'Performs grep-like searches on files and directories with pattern matching. Supports various grep options like recursive search, case-insensitive matching, line numbers, and more. Can handle bulk searches efficiently.',
  inputSchema: grepSearchInputSchema,
  outputSchema: grepSearchOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof grepSearchInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await grepSearchExecution(context, runtimeContext);
  },
});

export default grepSearch;
