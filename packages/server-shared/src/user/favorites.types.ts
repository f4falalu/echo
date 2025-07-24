import { z } from 'zod';
import { AssetTypeSchema } from '../assets/asset-types.types';

export const UserFavoriteSchema = z.object({
  id: z.string(),
  asset_type: AssetTypeSchema,
  index: z.number().optional(),
  name: z.string(),
});

export type UserFavorite = z.infer<typeof UserFavoriteSchema>;
