import { z } from 'zod';

export const AssetTypeSchema = z.enum([
  'metric',
  'dashboard',
  'collection',
  'chat',
  'report',
  'thread',
  'metric_file',
  'dashboard_file',
  'data_source',
  'filter',
  'dataset',
  'tool',
  'source',
  'collection_file',
  'dataset_permission',
]);

export type AssetType = z.infer<typeof AssetTypeSchema>;
