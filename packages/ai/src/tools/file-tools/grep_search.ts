import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { AnalystRuntimeContext } from '../../workflows/analyst-workflow';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const grepSearchConfigSchema = z.object({
  path: z.string().describe('File or directory path to search'),
  pattern: z.string().describe('Search pattern'),
  recursive: z.boolean().optional().default(false).describe('Recursive search (-r)'),
  ignoreCase: z.boolean().optional().default(false).describe('Case-insensitive search (-i)'),
  invertMatch: z.boolean().optional().default(false).describe('Invert matches (-v)'),
  lineNumbers: z.boolean().optional().default(true).describe('Show line numbers (-n)'),
  wordMatch: z.boolean().optional().default(false).describe('Match whole words only (-w)'),
  fixedStrings: z.boolean().optional().default(false).describe('Treat pattern as fixed string (-F)'),
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

export type GrepSearchConfig = z.infer<typeof grepSearchConfigSchema>;
export type GrepSearchInput = z.infer<typeof grepSearchInputSchema>;
export type GrepSearchOutput = z.infer<typeof grepSearchOutputSchema>;

function executeGrepSearch(search: GrepSearchConfig): {
  success: boolean;
  path: string;
  pattern: string;
  matches?: Array<{ file: string; lineNumber?: number; content: string }>;
  matchCount?: number;
  error?: string;
} {
  try {
    if (!existsSync(search.path)) {
      return {
        success: false,
        path: search.path,
        pattern: search.pattern,
        error: `Path does not exist: ${search.path}`,
      };
    }

    const grepArgs: string[] = [];
    
    if (search.recursive) grepArgs.push('-r');
    if (search.ignoreCase) grepArgs.push('-i');
    if (search.invertMatch) grepArgs.push('-v');
    if (search.lineNumbers) grepArgs.push('-n');
    if (search.wordMatch) grepArgs.push('-w');
    if (search.fixedStrings) grepArgs.push('-F');
    if (search.maxCount) grepArgs.push('-m', search.maxCount.toString());
    
    grepArgs.push(search.pattern);
    grepArgs.push(search.path);
    
    const output = execSync(`grep ${grepArgs.map(arg => `"${arg.replace(/"/g, '\\"')}"`).join(' ')}`, { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      timeout: 30000 // 30 second timeout
    });
    
    const lines = output.trim().split('\n').filter(line => line.length > 0);
    const matches: Array<{ file: string; lineNumber?: number; content: string }> = [];
    
    for (const line of lines) {
      if (search.lineNumbers) {
        const match = line.match(/^([^:]+):(\d+):(.*)$/);
        if (match && match[1] && match[2] && match[3] !== undefined) {
          matches.push({
            file: match[1],
            lineNumber: parseInt(match[2], 10),
            content: match[3]
          });
        } else {
          matches.push({
            file: search.path,
            content: line
          });
        }
      } else {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          matches.push({
            file: line.substring(0, colonIndex),
            content: line.substring(colonIndex + 1)
          });
        } else {
          matches.push({
            file: search.path,
            content: line
          });
        }
      }
    }
    
    return {
      success: true,
      path: search.path,
      pattern: search.pattern,
      matches,
      matchCount: matches.length
    };
    
  } catch (error: any) {
    if (error.status === 1) {
      return {
        success: true,
        path: search.path,
        pattern: search.pattern,
        matches: [],
        matchCount: 0
      };
    } else {
      return {
        success: false,
        path: search.path,
        pattern: search.pattern,
        error: error.message || 'Unknown error occurred'
      };
    }
  }
}

async function processGrepSearches(
  params: GrepSearchInput,
  runtimeContext: RuntimeContext<AnalystRuntimeContext>
): Promise<GrepSearchOutput> {
  const startTime = Date.now();
  const { searches } = params;
  
  const successfulSearches: z.infer<typeof grepSearchResultSchema>[] = [];
  const failedSearches: z.infer<typeof grepSearchFailureSchema>[] = [];
  
  const results = await Promise.allSettled(
    searches.map(async (search) => {
      try {
        const result = executeGrepSearch(search);
        
        if (result.success) {
          return {
            type: 'success' as const,
            data: {
              path: result.path,
              pattern: result.pattern,
              matches: result.matches || [],
              matchCount: result.matchCount || 0,
            },
          };
        } else {
          return {
            type: 'failure' as const,
            data: {
              path: result.path,
              pattern: result.pattern,
              error: result.error || 'Unknown error occurred',
            },
          };
        }
      } catch (error) {
        return {
          type: 'failure' as const,
          data: {
            path: search.path,
            pattern: search.pattern,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          },
        };
      }
    })
  );
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value.type === 'success') {
        successfulSearches.push(result.value.data);
      } else {
        failedSearches.push(result.value.data);
      }
    } else {
      failedSearches.push({
        path: 'unknown',
        pattern: 'unknown',
        error: result.reason?.message || 'Promise rejected',
      });
    }
  }
  
  const duration = Date.now() - startTime;
  
  return {
    message: `Completed ${successfulSearches.length} searches successfully, ${failedSearches.length} failed`,
    duration,
    successful_searches: successfulSearches,
    failed_searches: failedSearches,
  };
}

const executeGrepSearches = wrapTraced(
  async (
    params: GrepSearchInput,
    runtimeContext: RuntimeContext<AnalystRuntimeContext>
  ): Promise<GrepSearchOutput> => {
    return await processGrepSearches(params, runtimeContext);
  },
  { name: 'grepSearchTool' }
);

// Export the tool
export const grepSearch = createTool({
  id: 'grep_search',
  description: 'Performs grep-like searches on files and directories with pattern matching. Supports various grep options like recursive search, case-insensitive matching, line numbers, and more. Can handle bulk searches efficiently.',
  inputSchema: grepSearchInputSchema,
  outputSchema: grepSearchOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: GrepSearchInput;
    runtimeContext: RuntimeContext<AnalystRuntimeContext>;
  }) => {
    return await executeGrepSearches(context, runtimeContext);
  },
});

export default grepSearch;
