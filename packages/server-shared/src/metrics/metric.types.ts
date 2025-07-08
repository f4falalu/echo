import { z } from 'zod/v4';
import { ShareConfigSchema, VerificationStatusSchema } from '../share';
import { ChartConfigPropsSchema } from './charts';
import { DEFAULT_CHART_CONFIG } from './charts/chartConfigProps';
import { getDefaults } from './defaultHelpers';
import { DataMetadataSchema } from './metadata.type';

export const MetricSchema = z.object({
  id: z.string(),
  type: z.literal('metric'),
  name: z.string(),
  version_number: z.number(),
  description: z.string().nullable(),
  file_name: z.string(),
  time_frame: z.string(),
  dataset_id: z.string(),
  data_source_id: z.string(),
  dataset_name: z.string().nullable(),
  error: z.string().nullable(),
  chart_config: ChartConfigPropsSchema.default(DEFAULT_CHART_CONFIG),
  data_metadata: DataMetadataSchema,
  status: VerificationStatusSchema,
  evaluation_score: z.enum(['Moderate', 'High', 'Low']),
  evaluation_summary: z.string(),
  file: z.string(), // yaml file
  created_at: z.string(),
  updated_at: z.string(),
  sent_by_id: z.string(),
  sent_by_name: z.string(),
  sent_by_avatar_url: z.string().nullable(),
  sql: z.string().nullable(),
  dashboards: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
  collections: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
  versions: z.array(
    z.object({
      version_number: z.number(),
      updated_at: z.string(),
    })
  ),
  ...ShareConfigSchema.shape,
});

export type Metric = z.infer<typeof MetricSchema>;

export const DEFAULT_METRIC: Required<Metric> = getDefaults(MetricSchema);
