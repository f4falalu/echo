import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

interface EditOperation {
  code_to_replace: string;
  code: string;
}

interface EditReportsParams {
  id: string;
  name: string;
  edits: EditOperation[];
}

interface EditReportsOutput {
  success: boolean;
  message: string;
  file: {
    id: string;
    name: string;
    code: string;
  };
}

// Main edit reports function
const editReportsFile = wrapTraced(
  async (params: EditReportsParams): Promise<EditReportsOutput> => {
    // Dummy implementation - simulate applying edits
    let simulatedCode = '// Existing report code';

    // Simulate applying each edit
    for (const edit of params.edits) {
      if (edit.code_to_replace === '') {
        // Append mode
        simulatedCode += `\n${edit.code}`;
      } else {
        // Replace mode (in a real implementation)
        simulatedCode = simulatedCode.replace(edit.code_to_replace, edit.code);
      }
    }

    return {
      success: true,
      message: `Successfully edited report: ${params.name}`,
      file: {
        id: params.id,
        name: params.name,
        code: simulatedCode,
      },
    };
  },
  { name: 'edit-reports-file' }
);

// Export the tool
export const editReports = createTool({
  id: 'edit-reports',
  description: 'Edit an existing report with find/replace operations or appends',
  inputSchema: z.object({
    id: z.string().describe('The ID of the report to edit'),
    name: z.string().describe('The updated name of the report'),
    edits: z
      .array(
        z.object({
          code_to_replace: z
            .string()
            .describe('Code to replace. If empty, appends to existing code'),
          code: z.string().describe('The new code to insert or replace with'),
        })
      )
      .describe('Array of edit operations to apply'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    file: z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
    }),
  }),
  execute: async ({ context }) => {
    return await editReportsFile(context as EditReportsParams);
  },
});
