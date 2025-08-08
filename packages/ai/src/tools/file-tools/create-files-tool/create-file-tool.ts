import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { z } from 'zod';
import { createCreateFilesTool } from './create-files-tool';

// Re-export schemas and types for backward compatibility
const FileCreateParamsSchema = z.object({
  path: z.string().describe('The relative or absolute path to create the file at'),
  content: z.string().describe('The content to write to the file'),
});

export const CreateFilesInputSchema = z.object({
  files: z.array(FileCreateParamsSchema).describe('Array of file creation operations to perform'),
});

const CreateFilesOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        filePath: z.string(),
      }),
      z.object({
        status: z.literal('error'),
        filePath: z.string(),
        errorMessage: z.string(),
      }),
    ])
  ),
});

const CreateFilesContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  sandbox: z
    .custom<Sandbox>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'fs' in val;
      },
      { message: 'Invalid Sandbox instance' }
    )
    .describe('Sandbox instance for file operations'),
});

export type CreateFilesInput = z.infer<typeof CreateFilesInputSchema>;
export type CreateFilesOutput = z.infer<typeof CreateFilesOutputSchema>;
export type CreateFilesContext = z.infer<typeof CreateFilesContextSchema>;

// Factory function that creates the tool with context
export function createFiles(context: CreateFilesContext) {
  return createCreateFilesTool(context);
}

// Default export using factory pattern - requires context to be passed
export default createFiles;
