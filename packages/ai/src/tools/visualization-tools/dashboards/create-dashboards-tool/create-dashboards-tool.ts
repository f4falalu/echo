import { tool } from 'ai';
import { z } from 'zod';
import { getDashboardToolDescription } from '../helpers/get-dashboard-tool-descripton';
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

const CreateDashboardsFileSchema = z.object({
  name: z.string(),
  yml_content: z.string(),
  status: z.enum(['processing', 'completed', 'failed']).optional(),
  id: z.string().optional(),
  version: z.number().optional(),
  error: z.string().optional(),
});

const CreateDashboardsStateSchema = z.object({
  toolCallId: z.string().optional(),
  argsText: z.string().optional(),
  parsedArgs: CreateDashboardsInputSchema.optional(),
  files: z.array(CreateDashboardsFileSchema).optional(),
});

// Export types
export type CreateDashboardsInput = z.infer<typeof CreateDashboardsInputSchema>;
export type CreateDashboardsOutput = z.infer<typeof CreateDashboardsOutputSchema>;
export type CreateDashboardsContext = z.infer<typeof CreateDashboardsContextSchema>;
export type CreateDashboardsFile = z.infer<typeof CreateDashboardsFileSchema>;
export type CreateDashboardsState = z.infer<typeof CreateDashboardsStateSchema>;

// Factory function that accepts agent context and maps to tool context
export function createCreateDashboardsTool(context: CreateDashboardsContext) {
  // Initialize state for streaming
  const state: CreateDashboardsState = {
    argsText: undefined,
    files: undefined,
    parsedArgs: undefined,
    toolCallId: undefined,
  };

  // Create all functions with the context and state passed
  const execute = createCreateDashboardsExecute(context, state);
  const onInputStart = createCreateDashboardsStart(context, state);
  const onInputDelta = createCreateDashboardsDelta(context, state);
  const onInputAvailable = createCreateDashboardsFinish(context, state);

  return tool({
    description: getDashboardToolDescription(),
    inputSchema: CreateDashboardsInputSchema,
    outputSchema: CreateDashboardsOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
