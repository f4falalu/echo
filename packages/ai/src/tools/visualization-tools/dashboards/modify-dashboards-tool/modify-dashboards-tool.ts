import { tool } from 'ai';
import { z } from 'zod';
import { getDashboardToolDescription } from '../helpers/get-dashboard-tool-description';
import { createModifyDashboardsDelta } from './modify-dashboards-delta';
import { createModifyDashboardsExecute } from './modify-dashboards-execute';
import { createModifyDashboardsFinish } from './modify-dashboards-finish';
import { createModifyDashboardsStart } from './modify-dashboards-start';

// File structure for modify dashboards
export interface ModifyDashboardsFile {
  id: string;
  name?: string;
  yml_content: string;
  status?: 'processing' | 'completed' | 'failed';
  version?: number;
  error?: string;
}

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
      id: z.string(),
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

// Factory function that accepts agent context and maps to tool context
export function createModifyDashboardsTool(context: ModifyDashboardsContext) {
  // Initialize state for streaming
  const state: ModifyDashboardsState = {
    argsText: '',
    files: [],
    messageId: context.messageId,
  };

  // Create all functions with the context and state passed
  const execute = createModifyDashboardsExecute(context, state);
  const onInputStart = createModifyDashboardsStart(context, state);
  const onInputDelta = createModifyDashboardsDelta(context, state);
  const onInputAvailable = createModifyDashboardsFinish(context, state);

  return tool({
    description: getDashboardToolDescription(),
    inputSchema: ModifyDashboardsInputSchema,
    outputSchema: ModifyDashboardsOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
