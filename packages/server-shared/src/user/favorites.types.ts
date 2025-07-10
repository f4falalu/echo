import { z } from 'zod';
import { ShareAssetTypeSchema } from '../share';

export const UserFavoriteSchema = z.object({
  id: z.string(),
  asset_type: ShareAssetTypeSchema,
  index: z.number().optional(),
  name: z.string(),
});

export type UserFavorite = z.infer<typeof UserFavoriteSchema>;
