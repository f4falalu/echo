import { tool } from 'ai';
import { z } from 'zod';
import { getMetricToolDescription } from '../helpers/get-metric-tool-description';
import { createCreateMetricsDelta } from './create-metrics-delta';
import { createCreateMetricsExecute } from './create-metrics-execute';
import { createCreateMetricsFinish } from './create-metrics-finish';
import { createCreateMetricsStart } from './create-metrics-start';

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
  file_type: z.string(),
  result_message: z.string().optional(),
  results: z.array(z.record(z.any())).optional(),
  created_at: z.string(),
  updated_at: z.string(),
  version_number: z.number(),
});

const CreateMetricsOutputFailedFileSchema = z.object({
  name: z.string(),
  error: z.string(),
});

const CreateMetricsOutputSchema = z.object({
  message: z.string(),
  duration: z.number(),
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

const CreateMetricsReasoningFileSchema = z.object({
  name: z.string(),
  yml_content: z.string(),
  status: z.enum(['processing', 'completed', 'failed']).optional(),
  id: z.string().optional(),
  version: z.number().optional(),
  error: z.string().optional(),
});

const CreateMetricsStateSchema = z.object({
  toolCallId: z.string().optional(),
  argsText: z.string().optional(),
  files: z.array(CreateMetricsReasoningFileSchema).optional(),
  failed_files: z.array(CreateMetricsReasoningFileSchema).optional(),
});

export type CreateMetricsInput = z.infer<typeof CreateMetricsInputSchema>;
export type CreateMetricsOutput = z.infer<typeof CreateMetricsOutputSchema>;
export type CreateMetricsContext = z.infer<typeof CreateMetricsContextSchema>;
export type CreateMetricsReasoningFile = z.infer<typeof CreateMetricsReasoningFileSchema>;
export type CreateMetricsState = z.infer<typeof CreateMetricsStateSchema>;
export type CreateMetricsInputFile = z.infer<typeof CreateMetricsInputFileSchema>;
export type CreateMetricsOutputFile = z.infer<typeof CreateMetricsOutputFileSchema>;
export type CreateMetricsOutputFailedFile = z.infer<typeof CreateMetricsOutputFailedFileSchema>;

export function createCreateMetricsTool(context: CreateMetricsContext) {
  const state: CreateMetricsState = {
    argsText: undefined,
    files: undefined,
    toolCallId: undefined,
  };

  // Create all functions with the state captured via closure
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
