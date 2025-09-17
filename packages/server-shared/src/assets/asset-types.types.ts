import { z } from 'zod';

export const AssetTypeSchema = z.enum([
  'chat',
  'metric_file',
  'dashboard_file',
  'report_file',
  'collection',
]);

export type AssetType = z.infer<typeof AssetTypeSchema>;
