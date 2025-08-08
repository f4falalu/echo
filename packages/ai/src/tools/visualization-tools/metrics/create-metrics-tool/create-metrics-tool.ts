import { tool } from 'ai';
import { z } from 'zod';
import { createCreateMetricsDelta } from './create-metrics-delta';
import { createCreateMetricsExecute } from './create-metrics-execute';
import { createCreateMetricsFinish } from './create-metrics-finish';
import { createCreateMetricsStart } from './create-metrics-start';
import { getMetricToolDescription } from '../helpers/get-metric-tool-description';

const CreateMetricsInputSchema = z.object({
  files: z
    .array(
      z.object({
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
      })
    )
    .min(1)
    .describe(
      'List of file parameters to create. The files will contain YAML content that adheres to the metric schema specification.'
    ),
});

const CreateMetricsOutputSchema = z.object({
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

const CreateMetricsContextSchema = z.object({
  userId: z.string().describe('The user ID'),
  chatId: z.string().describe('The chat ID'),
  dataSourceId: z.string().describe('The data source ID'),
  dataSourceSyntax: z.string().describe('The data source syntax'),
  organizationId: z.string().describe('The organization ID'),
  messageId: z.string().optional().describe('The message ID'),
});

const CreateMetricsFileSchema = z.object({
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
  parsedArgs: CreateMetricsInputSchema.optional(),
  files: z.array(CreateMetricsFileSchema).optional(),
});

export type CreateMetricsInput = z.infer<typeof CreateMetricsInputSchema>;
export type CreateMetricsOutput = z.infer<typeof CreateMetricsOutputSchema>;
export type CreateMetricsContext = z.infer<typeof CreateMetricsContextSchema>;
export type CreateMetricsFile = z.infer<typeof CreateMetricsFileSchema>;
export type CreateMetricsState = z.infer<typeof CreateMetricsStateSchema>;

export function createCreateMetricsTool(context: CreateMetricsContext) {
  // Initialize state for streaming
  const state: CreateMetricsState = {
    argsText: undefined,
    files: undefined,
    parsedArgs: undefined,
    toolCallId: undefined,
  };

  // Create all functions with the context and state passed
  const execute = createCreateMetricsExecute(context, state);
  const onInputStart = createCreateMetricsStart(context, state);
  const onInputDelta = createCreateMetricsDelta(context, state);
  const onInputAvailable = createCreateMetricsFinish(context, state);

  return tool({
    description: getMetricToolDescription(),
    parameters: CreateMetricsInputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
