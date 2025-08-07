import { tool } from 'ai';
import { z } from 'zod';
import { createCreateDashboardsDelta } from './create-dashboards-delta';
import { createCreateDashboardsExecute } from './create-dashboards-execute';
import { createCreateDashboardsFinish } from './create-dashboards-finish';
import { createCreateDashboardsStart } from './create-dashboards-start';

// Input schema for the create dashboards tool
const CreateDashboardsInputSchema = z.object({
  files: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "The natural language name/title for the dashboard, exactly matching the 'name' field within the YML content. This name will identify the dashboard in the UI. Do not include file extensions or use file path characters."
          ),
        yml_content: z
          .string()
          .describe(
            "The YAML content for a single dashboard, adhering to the comprehensive dashboard schema. Multiple dashboards can be created in one call by providing multiple entries in the 'files' array. **Prefer creating dashboards in bulk.**"
          ),
      })
    )
    .min(1)
    .describe(
      'List of dashboard file parameters to create. The files will contain YAML content that adheres to the dashboard schema specification.'
    ),
});

// Output schema for the create dashboards tool
const CreateDashboardsOutputSchema = z.object({
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
      name: z.string(),
      error: z.string(),
    })
  ),
});

// Context schema for the create dashboards tool
const CreateDashboardsContextSchema = z.object({
  userId: z.string().describe('The user ID'),
  chatId: z.string().describe('The chat ID'),
  dataSourceId: z.string().describe('The data source ID'),
  dataSourceSyntax: z.string().describe('The data source syntax'),
  organizationId: z.string().describe('The organization ID'),
  messageId: z.string().optional().describe('The message ID'),
});

// Export types
export type CreateDashboardsInput = z.infer<typeof CreateDashboardsInputSchema>;
export type CreateDashboardsOutput = z.infer<typeof CreateDashboardsOutputSchema>;
export type CreateDashboardsContext = z.infer<typeof CreateDashboardsContextSchema>;

// State management for streaming
export interface CreateDashboardsFile {
  name: string;
  yml_content: string;
  status?: 'processing' | 'completed' | 'failed';
  id?: string;
  version?: number;
  error?: string;
}

export interface CreateDashboardsState {
  toolCallId?: string;
  argsText: string;
  parsedArgs?: Partial<CreateDashboardsInput>;
  files: CreateDashboardsFile[];
  processingStartTime?: number;
  messageId?: string | undefined;
  reasoningEntryId?: string;
  responseEntryId?: string;
}

// Type constraint for agent context - must have required fields
export type CreateDashboardsAgentContext = {
  userId: string;
  chatId: string;
  dataSourceId: string;
  dataSourceSyntax: string;
  organizationId: string;
  messageId?: string | undefined;
};

// Factory function that accepts agent context and maps to tool context
export function createCreateDashboardsTool<
  TAgentContext extends CreateDashboardsAgentContext = CreateDashboardsAgentContext,
>(context: TAgentContext) {
  // Initialize state for streaming
  const state: CreateDashboardsState = {
    argsText: '',
    files: [],
    messageId: context.messageId,
  };

  // Create all functions with the context and state passed
  const execute = createCreateDashboardsExecute<TAgentContext>(context, state);
  const onInputStart = createCreateDashboardsStart<TAgentContext>(context, state);
  const onInputDelta = createCreateDashboardsDelta<TAgentContext>(context, state);
  const onInputAvailable = createCreateDashboardsFinish<TAgentContext>(context, state);

  // Get the description from the original tool
  const description = `Creates dashboard configuration files with YAML content following the dashboard schema specification. Before using this tool, carefully consider the dashboard layout, metric references, and row organization. Each dashboard references existing metrics by their UUIDs and organizes them into rows with specific column layouts. **This tool supports creating multiple dashboards in a single call; prefer using bulk creation over creating dashboards one by one.**

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
    inputSchema: CreateDashboardsInputSchema,
    outputSchema: CreateDashboardsOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
