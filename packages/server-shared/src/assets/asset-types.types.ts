import { AssetTypeSchema } from '@buster/database';
import type { AssetType } from '@buster/database';
import type { z } from 'zod';

export const BaseAssetTypeSchema = AssetTypeSchema.exclude(['chat', 'collection']);

export type BaseAssetType = z.infer<typeof BaseAssetTypeSchema>;

export { AssetTypeSchema };

export type { AssetType };
