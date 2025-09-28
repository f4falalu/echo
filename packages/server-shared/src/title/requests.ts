import { z } from 'zod';
import { AssetTypeSchema } from '../assets';

export const GetTitleRequestSchema = z.object({
  assetId: z.string().uuid(),
  assetType: AssetTypeSchema,
});

export type GetTitleRequest = z.infer<typeof GetTitleRequestSchema>;
