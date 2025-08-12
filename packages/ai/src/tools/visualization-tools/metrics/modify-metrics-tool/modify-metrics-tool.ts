import { StatusSchema } from '@buster/server-shared/chats';
import { tool } from 'ai';
import { z } from 'zod';
import { getMetricToolDescription } from '../helpers/get-metric-tool-description';
import { createModifyMetricsDelta } from './modify-metrics-delta';
import { createModifyMetricsExecute } from './modify-metrics-execute';
import { createModifyMetricsFinish } from './modify-metrics-finish';
import { createModifyMetricsStart } from './modify-metrics-start';

export const TOOL_NAME = 'modifyMetrics';

const ModifyMetricsInputFileSchema = z.object({
  id: z.string().describe('The UUID of the metric file to modify'),
  yml_content: z
    .string()
    .describe(
      'The complete updated YAML content for the metric. This replaces the entire existing content.'
    ),
});

const ModifyMetricsInputSchema = z.object({
  files: z
    .array(ModifyMetricsInputFileSchema)
    .min(1)
    .describe(
      'Array of metric files to modify with their complete updated YAML content. **Prefer modifying metrics in bulk.**'
    ),
});

const ModifyMetricsOutputFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  version_number: z.number(),
});

const ModifyMetricsOutputFailedFileSchema = z.object({
  id: z.string(),
  error: z.string(),
});

const ModifyMetricsOutputSchema = z.object({
  message: z.string(),
  files: z.array(ModifyMetricsOutputFileSchema),
  failed_files: z.array(ModifyMetricsOutputFailedFileSchema),
});

const ModifyMetricsContextSchema = z.object({
  userId: z.string().describe('The user ID'),
  chatId: z.string().describe('The chat ID'),
  dataSourceId: z.string().describe('The data source ID'),
  dataSourceSyntax: z.string().describe('The data source syntax'),
  organizationId: z.string().describe('The organization ID'),
  messageId: z.string().optional().describe('The message ID'),
});

const ModifyMetricStateFileSchema = z.object({
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
  yml_content: z.string().optional(),
});

const ModifyMetricsStateSchema = z.object({
  toolCallId: z.string().optional(),
  argsText: z.string().optional(),
  files: z.array(ModifyMetricStateFileSchema).optional(),
});

// Export types
export type ModifyMetricsInput = z.infer<typeof ModifyMetricsInputSchema>;
export type ModifyMetricsOutput = z.infer<typeof ModifyMetricsOutputSchema>;
export type ModifyMetricsContext = z.infer<typeof ModifyMetricsContextSchema>;
export type ModifyMetricsOutputFile = z.infer<typeof ModifyMetricsOutputFileSchema>;
export type ModifyMetricsOutputFailedFile = z.infer<typeof ModifyMetricsOutputFailedFileSchema>;
export type ModifyMetricsState = z.infer<typeof ModifyMetricsStateSchema>;
export type ModifyMetricStateFile = z.infer<typeof ModifyMetricStateFileSchema>;

// Factory function that accepts agent context and maps to tool context
export function createModifyMetricsTool(context: ModifyMetricsContext) {
  // Initialize state for streaming
  const state: ModifyMetricsState = {
    argsText: undefined,
    files: [],
    toolCallId: undefined,
  };

  // Create all functions with the context and state passed
  const execute = createModifyMetricsExecute(context, state);
  const onInputStart = createModifyMetricsStart(context, state);
  const onInputDelta = createModifyMetricsDelta(context, state);
  const onInputAvailable = createModifyMetricsFinish(context, state);

  // Build the description with the metric schema
  const description = `Updates existing metric configuration files with new YAML content. Provide the complete YAML content for each metric, replacing the entire existing file. This tool is ideal for bulk modifications when you need to update multiple metrics simultaneously. The system will preserve version history and perform all necessary validations on the new content. For each metric, you need its UUID and the complete updated YAML content. **Prefer modifying metrics in bulk using this tool rather than one by one.**

${getMetricToolDescription()}`;

  return tool({
    description,
    inputSchema: ModifyMetricsInputSchema,
    outputSchema: ModifyMetricsOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
