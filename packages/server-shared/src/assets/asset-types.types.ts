import { z } from 'zod';

export const BaseAssetTypeSchema = z.enum(['metric_file', 'dashboard_file', 'report_file']);

export type BaseAssetType = z.infer<typeof BaseAssetTypeSchema>;

export const AssetTypeSchema = z.enum([...BaseAssetTypeSchema.options, 'chat', 'collection']);

export type AssetType = z.infer<typeof AssetTypeSchema>;
