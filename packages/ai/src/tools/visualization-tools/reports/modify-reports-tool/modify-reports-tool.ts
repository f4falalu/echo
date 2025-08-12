import { StatusSchema } from '@buster/server-shared';
import { tool } from 'ai';
import { z } from 'zod';
import { createModifyReportsDelta } from './modify-reports-delta';
import { createModifyReportsExecute } from './modify-reports-execute';
import { createModifyReportsFinish } from './modify-reports-finish';
import { modifyReportsStart } from './modify-reports-start';

export const TOOL_NAME = 'modifyReports';

const ModifyReportsEditSchema = z.object({
  code_to_replace: z
    .string()
    .describe(
      'Markdown content to find and replace. If empty string, the code will be appended to the report.'
    ),
  code: z
    .string()
    .describe(
      'The new markdown content to insert. Either replaces code_to_replace or appends to the end.'
    ),
});

// Input schema for the modify reports tool
const ModifyReportsInputSchema = z.object({
  id: z.string().uuid().describe('The UUID of the report to edit. Must be an existing report ID.'),
  name: z.string().describe('The name of the report (for reference and tracking purposes)'),
  edits: z
    .array(ModifyReportsEditSchema)
    .min(1)
    .describe('Array of edit operations to apply sequentially to the report'),
});

// Output schema for the modify reports tool
const ModifyReportsOutputSchema = z.object({
  success: z.boolean().describe('Whether all edits were successfully applied'),
  message: z.string().describe('Human-readable result message'),
  file: z.object({
    id: z.string().describe('The report ID'),
    name: z.string().describe('The report name'),
    content: z.string().describe('The updated report content after all edits'),
    version_number: z.number().describe('The new version number after edits'),
    updated_at: z.string().describe('ISO timestamp of the update'),
  }),
  error: z.string().optional().describe('Error details if any operations failed'),
});

// Context schema for the modify reports tool
const ModifyReportsContextSchema = z.object({
  userId: z.string().describe('The user ID'),
  chatId: z.string().describe('The chat ID'),
  organizationId: z.string().describe('The organization ID'),
  messageId: z.string().optional().describe('The message ID'),
});

const ModifyReportsEditStateSchema = z.object({
  operation: z.enum(['replace', 'append']),
  code_to_replace: z.string(),
  code: z.string(),
  status: StatusSchema,
  error: z.string().optional(),
});

const ModifyReportsStateSchema = z.object({
  toolCallId: z.string().optional(),
  argsText: z.string().optional(),
  reportId: z.string().uuid().optional(),
  reportName: z.string().optional(),
  edits: z.array(ModifyReportsEditStateSchema).optional(),
  currentContent: z.string().optional(),
  finalContent: z.string().optional(),
  version_number: z.number().optional(),
});

// Export types
export type ModifyReportsInput = z.infer<typeof ModifyReportsInputSchema>;
export type ModifyReportsOutput = z.infer<typeof ModifyReportsOutputSchema>;
export type ModifyReportsContext = z.infer<typeof ModifyReportsContextSchema>;
export type ModifyReportsState = z.infer<typeof ModifyReportsStateSchema>;
export type ModifyReportsEditState = z.infer<typeof ModifyReportsEditStateSchema>;

// Report tool description
const MODIFY_REPORT_TOOL_DESCRIPTION = `Edit an existing report with find/replace operations or appends. 
  
## How Edits Work

This tool applies a series of edit operations to a report sequentially:

1. **Replace Mode** (when code_to_replace is provided):
   - Finds the exact text specified in code_to_replace
   - Replaces it with the text in code
   - The operation will fail if the text to replace is not found

2. **Append Mode** (when code_to_replace is empty):
   - Appends the text in code to the end of the report
   - Useful for adding new sections or content

## Best Practices

- Edits are applied in order, so later edits see the results of earlier ones
- Use specific, unique text for code_to_replace to avoid unintended replacements
- For large changes, consider using multiple smaller, targeted edits
- Always verify the report ID before attempting edits

## Example Usage

\`\`\`json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Q4 2024 Sales Report",
  "edits": [
    {
      "code_to_replace": "## Preliminary Results",
      "code": "## Final Results"
    },
    {
      "code_to_replace": "",
      "code": "\\n\\n## Addendum\\nAdditional analysis completed on..."
    }
  ]
}
\`\`\``;

// Factory function that accepts agent context and maps to tool context
export function createModifyReportsTool(context: ModifyReportsContext) {
  // Initialize state for streaming
  const state: ModifyReportsState = {
    argsText: undefined,
    reportId: undefined,
    reportName: undefined,
    edits: [],
    currentContent: undefined,
    finalContent: undefined,
    version_number: undefined,
    toolCallId: undefined,
  };

  // Create all functions with the context and state passed
  const execute = createModifyReportsExecute(context, state);
  const onInputStart = modifyReportsStart(context, state);
  const onInputDelta = createModifyReportsDelta(context, state);
  const onInputAvailable = createModifyReportsFinish(context, state);

  return tool({
    description: MODIFY_REPORT_TOOL_DESCRIPTION,
    inputSchema: ModifyReportsInputSchema,
    outputSchema: ModifyReportsOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
