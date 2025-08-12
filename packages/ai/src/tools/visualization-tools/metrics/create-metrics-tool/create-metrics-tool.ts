import { StatusSchema } from '@buster/server-shared/chats';
import { tool } from 'ai';
import { z } from 'zod';
import { getMetricToolDescription } from '../helpers/get-metric-tool-description';
import { createCreateMetricsDelta } from './create-metrics-delta';
import { createCreateMetricsExecute } from './create-metrics-execute';
import { createCreateMetricsFinish } from './create-metrics-finish';
import { createCreateMetricsStart } from './create-metrics-start';

export const TOOL_NAME = 'createMetrics';

const CreateMetricsInputFileSchema = z.object({
  name: z
    .string()
    .describe(
      "The natural language name/title for the metric, exactly matching the 'name' field within the YML content. This name will identify the metric in the UI. Do not include file extensions or use file path characters."
    ),
  yml_content: z
    .string()
    .describe(
      "The YAML content for a single metric, adhering to the comprehensive metric schema. Multiple metrics can be created in one call by providing multiple entries in the 'files' array. **Prefer creating metrics in bulk.**"
    ),
});

const CreateMetricsInputSchema = z.object({
  files: z
    .array(CreateMetricsInputFileSchema)
    .min(1)
    .describe(
      'List of file parameters to create. The files will contain YAML content that adheres to the metric schema specification.'
    ),
});

const CreateMetricsOutputFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  version_number: z.number(),
});

const CreateMetricsOutputFailedFileSchema = z.object({
  name: z.string(),
  error: z.string(),
});

const CreateMetricsOutputSchema = z.object({
  message: z.string(),
  files: z.array(CreateMetricsOutputFileSchema),
  failed_files: z.array(CreateMetricsOutputFailedFileSchema),
});

const CreateMetricsContextSchema = z.object({
  userId: z.string().describe('The user ID'),
  chatId: z.string().describe('The chat ID'),
  dataSourceId: z.string().describe('The data source ID'),
  dataSourceSyntax: z.string().describe('The data source syntax'),
  organizationId: z.string().describe('The organization ID'),
  messageId: z.string().optional().describe('The message ID'),
});

const CreateMetricStateFileSchema = z.object({
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

const CreateMetricsStateSchema = z.object({
  toolCallId: z.string().optional(),
  argsText: z.string().optional(),
  files: z.array(CreateMetricStateFileSchema).optional(),
});

// Export types
export type CreateMetricsInput = z.infer<typeof CreateMetricsInputSchema>;
export type CreateMetricsOutput = z.infer<typeof CreateMetricsOutputSchema>;
export type CreateMetricsContext = z.infer<typeof CreateMetricsContextSchema>;
export type CreateMetricsOutputFile = z.infer<typeof CreateMetricsOutputFileSchema>;
export type CreateMetricsOutputFailedFile = z.infer<typeof CreateMetricsOutputFailedFileSchema>;
export type CreateMetricsState = z.infer<typeof CreateMetricsStateSchema>;
export type CreateMetricStateFile = z.infer<typeof CreateMetricStateFileSchema>;

// Factory function that accepts agent context and maps to tool context
export function createCreateMetricsTool(context: CreateMetricsContext) {
  // Initialize state for streaming
  const state: CreateMetricsState = {
    argsText: undefined,
    files: [],
    toolCallId: undefined,
  };

  // Create all functions with the context and state passed
  const execute = createCreateMetricsExecute(context, state);
  const onInputStart = createCreateMetricsStart(context, state);
  const onInputDelta = createCreateMetricsDelta(context, state);
  const onInputAvailable = createCreateMetricsFinish(context, state);

  return tool({
    description: getMetricToolDescription(),
    inputSchema: CreateMetricsInputSchema,
    outputSchema: CreateMetricsOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
