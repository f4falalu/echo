import { StatusSchema } from '@buster/server-shared/chats';
import { tool } from 'ai';
import { z } from 'zod';
import { getDashboardToolDescription } from '../helpers/get-dashboard-tool-description';
import { createModifyDashboardsDelta } from './modify-dashboards-delta';
import { createModifyDashboardsExecute } from './modify-dashboards-execute';
import { createModifyDashboardsFinish } from './modify-dashboards-finish';
import { createModifyDashboardsStart } from './modify-dashboards-start';

export const TOOL_NAME = 'modifyDashboards';

const ModifyDashboardsInputFileSchema = z.object({
  id: z.string().uuid('Dashboard ID must be a valid UUID'),
  yml_content: z
    .string()
    .describe(
      'The complete updated YAML content for the dashboard. This replaces the entire existing content.'
    ),
});

// Input schema for the modify dashboards tool
const ModifyDashboardsInputSchema = z.object({
  files: z
    .array(ModifyDashboardsInputFileSchema)
    .min(1)
    .describe('Array of dashboard files to modify with their complete updated YAML content'),
});

const ModifyDashboardsOutputFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  version_number: z.number(),
});

const ModifyDashboardsOutputFailedFileSchema = z.object({
  id: z.string(),
  error: z.string(),
});

// Output schema for the modify dashboards tool
const ModifyDashboardsOutputSchema = z.object({
  message: z.string(),
  files: z.array(ModifyDashboardsOutputFileSchema),
  failed_files: z.array(ModifyDashboardsOutputFailedFileSchema),
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

const ModifyDashboardStateFileSchema = z.object({
  id: z.string().uuid(),
  file_name: z.string().optional(),
  file_type: z.string(),
  version_number: z.number(),
  file: z
    .object({
      text: z.string(),
    })
    .optional(),
  status: StatusSchema,
});

const ModifyDashboardsStateSchema = z.object({
  toolCallId: z.string().optional(),
  argsText: z.string().optional(),
  files: z.array(ModifyDashboardStateFileSchema).optional(),
});

// Export types
export type ModifyDashboardsInput = z.infer<typeof ModifyDashboardsInputSchema>;
export type ModifyDashboardsOutput = z.infer<typeof ModifyDashboardsOutputSchema>;
export type ModifyDashboardsContext = z.infer<typeof ModifyDashboardsContextSchema>;
export type ModifyDashboardsOutputFile = z.infer<typeof ModifyDashboardsOutputFileSchema>;
export type ModifyDashboardsOutputFailedFile = z.infer<
  typeof ModifyDashboardsOutputFailedFileSchema
>;
export type ModifyDashboardsState = z.infer<typeof ModifyDashboardsStateSchema>;
export type ModifyDashboardStateFile = z.infer<typeof ModifyDashboardStateFileSchema>;

export const MODIFY_DASHBOARDS_TOOL_NAME = 'modifyDashboards';

// Factory function that accepts agent context and maps to tool context
export function createModifyDashboardsTool(context: ModifyDashboardsContext) {
  // Initialize state for streaming
  const state: ModifyDashboardsState = {
    argsText: undefined,
    files: [],
    toolCallId: undefined,
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
