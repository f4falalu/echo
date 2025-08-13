import { z } from 'zod';

// Only asset types that support title retrieval
const TitleSupportedAssetTypeSchema = z.enum([
  'metric',
  'dashboard',
  'collection',
  'chat',
  'report',
]);

export const GetTitleRequestSchema = z.object({
  assetId: z.string().uuid(),
  assetType: TitleSupportedAssetTypeSchema,
});

export type GetTitleRequest = z.infer<typeof GetTitleRequestSchema>;
