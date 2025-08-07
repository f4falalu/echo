import { tool } from 'ai';
import { z } from 'zod';
import type { ModifyDashboardsFile } from './helpers/modify-dashboards-transform-helper';
import { createModifyDashboardsDelta } from './modify-dashboards-delta';
import { createModifyDashboardsExecute } from './modify-dashboards-execute';
import { createModifyDashboardsFinish } from './modify-dashboards-finish';
import { createModifyDashboardsStart } from './modify-dashboards-start';

// State management for streaming
export interface ModifyDashboardsState {
  toolCallId?: string;
  argsText: string;
  parsedArgs?: Partial<ModifyDashboardsInput>;
  files: ModifyDashboardsFile[];
  processingStartTime?: number;
  messageId?: string | undefined;
  reasoningEntryId?: string;
  responseEntryId?: string;
}

// Input schema for the modify dashboards tool
const ModifyDashboardsInputSchema = z.object({
  files: z
    .array(
      z.object({
        id: z.string().uuid('Dashboard ID must be a valid UUID'),
        yml_content: z
          .string()
          .describe(
            'The complete updated YAML content for the dashboard. This replaces the entire existing content.'
          ),
      })
    )
    .min(1)
    .describe('Array of dashboard files to modify with their complete updated YAML content'),
});

// Output schema for the modify dashboards tool
const ModifyDashboardsOutputSchema = z.object({
  message: z.string(),
  duration: z.number(),
  files: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      file_type: z.string(),
      result_message: z.string().optional(),
      results: z.array(z.record(z.any())).optional(),
      created_at: z.string(),
      updated_at: z.string(),
      version_number: z.number(),
    })
  ),
  failed_files: z.array(
    z.object({
      file_name: z.string(),
      error: z.string(),
    })
  ),
});

// Context schema for the modify dashboards tool
const ModifyDashboardsContextSchema = z.object({
  userId: z.string().describe('The user ID'),
  chatId: z.string().describe('The chat ID'),
  dataSourceId: z.string().describe('The data source ID'),
  dataSourceSyntax: z.string().describe('The data source syntax'),
  organizationId: z.string().describe('The organization ID'),
  messageId: z.string().optional().describe('The message ID'),
});

// Export types
export type ModifyDashboardsInput = z.infer<typeof ModifyDashboardsInputSchema>;
export type ModifyDashboardsOutput = z.infer<typeof ModifyDashboardsOutputSchema>;
export type ModifyDashboardsContext = z.infer<typeof ModifyDashboardsContextSchema>;

// Type constraint for agent context - must have required fields
export type ModifyDashboardsAgentContext = {
  userId: string;
  chatId: string;
  dataSourceId: string;
  dataSourceSyntax: string;
  organizationId: string;
  messageId?: string | undefined;
};

// Factory function that accepts agent context and maps to tool context
export function createModifyDashboardsTool<
  TAgentContext extends ModifyDashboardsAgentContext = ModifyDashboardsAgentContext,
>(context: TAgentContext) {
  // Initialize state for streaming
  const state: ModifyDashboardsState = {
    argsText: '',
    files: [],
    messageId: context.messageId,
  };

  // Create all functions with the context and state passed
  const execute = createModifyDashboardsExecute<TAgentContext>(context, state);
  const onInputStart = createModifyDashboardsStart<TAgentContext>(context, state);
  const onInputDelta = createModifyDashboardsDelta<TAgentContext>(context, state);
  const onInputAvailable = createModifyDashboardsFinish<TAgentContext>(context, state);

  // Get the description from the original tool
  const description = `Updates existing dashboard configuration files with new YAML content. Provide the complete YAML content for each dashboard, replacing the entire existing file. This tool is ideal for bulk modifications when you need to update multiple dashboards simultaneously. The system will preserve version history and perform all necessary validations on the new content. For each dashboard, you need its UUID and the complete updated YAML content. **Prefer modifying dashboards in bulk using this tool rather than one by one.**

## COMPLETE DASHBOARD YAML SCHEMA

# DASHBOARD CONFIGURATION - YML STRUCTURE
# ----------------------------------------
# Required fields:
#
# name: Your Dashboard Title  # Do NOT use quotes for string values
# description: A description of the dashboard, its metrics, and its purpose.  # NO quotes
# rows: 
#   - id: 1               # Required row ID (integer)
#     items:
#       - id: metric-uuid-1  # UUIDv4 of an existing metric, NO quotes
#     column_sizes: [12]   # Required - must sum to exactly 12
#   - id: 2 # REQUIRED
#     items:
#       - id: metric-uuid-2
#       - id: metric-uuid-3
#     column_sizes: 
#       - 6
#       - 6
#
# Rules:
# 1. Each row can have up to 4 items
# 2. Each row must have a unique ID
# 3. column_sizes is required and must specify the width for each item
# 4. Sum of column_sizes in a row must be exactly 12
# 5. Each column size must be at least 3
# 6. All arrays should follow the YML array syntax using \`-\` and should NOT USE \`[]\` formatting.
# 7. Don't use comments. The ones in the example are just for explanation
# 8. String values generally should NOT use quotes unless they contain special characters (like :, {, }, [, ], ,, &, *, #, ?, |, -, <, >, =, !, %, @, \`) or start/end with whitespace.
# 9. If a string contains special characters or needs to preserve leading/trailing whitespace, enclose it in double quotes (\`"\`). Example: \`name: "Sales & Marketing Dashboard"\`
# 10. Avoid special characters in names and descriptions where possible, but if needed, use quotes as described in rule 9. UUIDs should NEVER be quoted.

**CRITICAL:** Follow the schema exactly - all metric IDs must reference existing metrics, column sizes must sum to 12, and row IDs must be unique. The tool will validate all metric references against the database.`;

  return tool({
    description,
    inputSchema: ModifyDashboardsInputSchema,
    outputSchema: ModifyDashboardsOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
