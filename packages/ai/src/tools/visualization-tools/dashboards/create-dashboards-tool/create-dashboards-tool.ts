import { StatusSchema } from '@buster/server-shared/chats';
import { tool } from 'ai';
import { z } from 'zod';
import { getDashboardToolDescription } from '../helpers/get-dashboard-tool-description';
import { createCreateDashboardsDelta } from './create-dashboards-delta';
import { createCreateDashboardsExecute } from './create-dashboards-execute';
import { createCreateDashboardsFinish } from './create-dashboards-finish';
import { createDashboardsStart } from './create-dashboards-start';

export const TOOL_NAME = 'createDashboards';

const CreateDashboardsInputFileSchema = z.object({
  name: z.string(),
  yml_content: z.string(),
});

// Input schema for the create dashboards tool
const CreateDashboardsInputSchema = z.object({
  files: z.array(CreateDashboardsInputFileSchema).min(1),
});

const CreateDashboardsOutputFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  version_number: z.number(),
});

const CreateDashboardsOutputFailedFileSchema = z.object({
  name: z.string(),
  error: z.string(),
});

// Output schema for the create dashboards tool
const CreateDashboardsOutputSchema = z.object({
  message: z.string(),
  files: z.array(CreateDashboardsOutputFileSchema),
  failed_files: z.array(CreateDashboardsOutputFailedFileSchema),
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

const CreateDashboardStateFileSchema = z.object({
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

const CreateDashboardsStateSchema = z.object({
  toolCallId: z.string().optional(),
  argsText: z.string().optional(),
  files: z.array(CreateDashboardStateFileSchema).optional(),
});

// Export types
export type CreateDashboardsInput = z.infer<typeof CreateDashboardsInputSchema>;
export type CreateDashboardsOutput = z.infer<typeof CreateDashboardsOutputSchema>;
export type CreateDashboardsContext = z.infer<typeof CreateDashboardsContextSchema>;
export type CreateDashboardsOutputFile = z.infer<typeof CreateDashboardsOutputFileSchema>;
export type CreateDashboardsOutputFailedFile = z.infer<
  typeof CreateDashboardsOutputFailedFileSchema
>;
export type CreateDashboardsState = z.infer<typeof CreateDashboardsStateSchema>;
export type CreateDashboardStateFile = z.infer<typeof CreateDashboardStateFileSchema>;

// Factory function that accepts agent context and maps to tool context
export function createCreateDashboardsTool(context: CreateDashboardsContext) {
  // Initialize state for streaming
  const state: CreateDashboardsState = {
    argsText: undefined,
    files: [],
    toolCallId: undefined,
  };

  // Create all functions with the context and state passed
  const execute = createCreateDashboardsExecute(context, state);
  const onInputStart = createDashboardsStart(context, state);
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
