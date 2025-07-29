import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';

const editFileParamsSchema = z.object({
  filePath: z.string().describe('Relative or absolute path to the file'),
  findString: z.string().describe('Text to find (must appear exactly once)'),
  replaceString: z.string().describe('Text to replace the found text with'),
});

const editFilesInputSchema = z.object({
  edits: z
    .array(editFileParamsSchema)
    .min(1, 'At least one edit must be provided')
    .max(100, 'Maximum 100 edits allowed per request')
    .describe(
      'Array of edit operations to perform. Each edit specifies a file path, text to find, and replacement text. The find string must appear exactly once in the file.'
    ),
});

const editFilesOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        file_path: z.string(),
        message: z.string(),
      }),
      z.object({
        status: z.literal('error'),
        file_path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
  summary: z.object({
    total: z.number(),
    successful: z.number(),
    failed: z.number(),
  }),
});

const editFilesExecution = wrapTraced(
  async (
    params: z.infer<typeof editFilesInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof editFilesOutputSchema>> => {
    const { edits } = params;

    if (!edits || edits.length === 0) {
      return {
        results: [],
        summary: { total: 0, successful: 0, failed: 0 },
      };
    }

    try {
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (sandbox) {
        // Generate CommonJS code for sandbox execution
        const editsJson = JSON.stringify(edits);
        const sandboxCode = `
const fs = require('fs');
const path = require('path');

const editsJson = ${JSON.stringify(editsJson)};
const edits = JSON.parse(editsJson);
const results = [];

// Process edits
for (const edit of edits) {
  try {
    const resolvedPath = path.isAbsolute(edit.filePath) 
      ? edit.filePath 
      : path.join(process.cwd(), edit.filePath);
      
    // Read the file
    let content;
    try {
      content = fs.readFileSync(resolvedPath, 'utf-8');
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        results.push({
          success: false,
          filePath: edit.filePath,
          error: 'File not found'
        });
        continue;
      }
      throw error;
    }
    
    // Check if find string exists
    const occurrences = content.split(edit.findString).length - 1;
    
    if (occurrences === 0) {
      results.push({
        success: false,
        filePath: edit.filePath,
        error: 'Find string not found in file: "' + edit.findString + '"'
      });
      continue;
    }
    
    if (occurrences > 1) {
      results.push({
        success: false,
        filePath: edit.filePath,
        error: 'Find string "' + edit.findString + '" appears ' + occurrences + ' times. Please use a more specific string that appears only once.'
      });
      continue;
    }
    
    // Replace the string
    const newContent = content.replace(edit.findString, edit.replaceString);
    fs.writeFileSync(resolvedPath, newContent, 'utf-8');
    
    results.push({
      success: true,
      filePath: edit.filePath,
      message: 'Successfully replaced "' + edit.findString + '" with "' + edit.replaceString + '" in ' + edit.filePath
    });
  } catch (error) {
    results.push({
      success: false,
      filePath: edit.filePath,
      error: (error instanceof Error ? error.message : String(error)) || 'Unknown error'
    });
  }
}

console.log(JSON.stringify(results));
`;

        const result = await runTypescript(sandbox, sandboxCode);

        if (result.exitCode !== 0) {
          console.error('Sandbox execution failed. Exit code:', result.exitCode);
          console.error('Stderr:', result.stderr);
          console.error('Result:', result.result);
          throw new Error(`Sandbox execution failed: ${result.stderr || 'Unknown error'}`);
        }

        let fileResults: Array<{
          success: boolean;
          filePath: string;
          message?: string;
          error?: string;
        }>;
        try {
          fileResults = JSON.parse(result.result.trim());
        } catch (parseError) {
          console.error('Failed to parse sandbox output:', result.result);
          throw new Error(
            `Failed to parse sandbox output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
          );
        }

        const successful = fileResults.filter((r) => r.success).length;
        const failed = fileResults.length - successful;

        return {
          results: fileResults.map((fileResult) => {
            if (fileResult.success) {
              return {
                status: 'success' as const,
                file_path: fileResult.filePath,
                message: fileResult.message || 'File edited successfully',
              };
            }
            return {
              status: 'error' as const,
              file_path: fileResult.filePath,
              error_message: fileResult.error || 'Unknown error',
            };
          }),
          summary: {
            total: fileResults.length,
            successful,
            failed,
          },
        };
      }

      // When not in sandbox, we can't edit files
      // Return an error for each edit
      return {
        results: edits.map((edit) => ({
          status: 'error' as const,
          file_path: edit.filePath,
          error_message: 'File editing requires sandbox environment',
        })),
        summary: {
          total: edits.length,
          successful: 0,
          failed: edits.length,
        },
      };
    } catch (error) {
      return {
        results: edits.map((edit) => ({
          status: 'error' as const,
          file_path: edit.filePath,
          error_message: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
        summary: {
          total: edits.length,
          successful: 0,
          failed: edits.length,
        },
      };
    }
  },
  { name: 'edit-files' }
);

export const editFiles = createTool({
  id: 'edit-files',
  description: `Performs find-and-replace operations on files with validation and bulk editing support. Replaces specified text content with new content, but only if the find string appears exactly once in the file. Supports both relative and absolute file paths and can handle bulk operations through an array of edit objects.

Key features:
- Validates that the find string appears exactly once (returns error if 0 or multiple occurrences)
- Supports both relative and absolute file paths
- Handles bulk operations with individual success/failure tracking
- Continues processing remaining edits when errors occur
- Returns detailed error messages for various failure scenarios

Error conditions:
- File doesn't exist: Returns error indicating file not found
- Find string not found: Returns error indicating no match
- Find string found multiple times: Returns error suggesting a more specific string
- Permission/IO errors: Returns appropriate error messages

For bulk operations, each edit is processed independently and the tool returns both successful and failed operations with detailed results.`,
  inputSchema: editFilesInputSchema,
  outputSchema: editFilesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof editFilesInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await editFilesExecution(context, runtimeContext);
  },
});

export default editFiles;
