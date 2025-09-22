import z from 'zod';

export const TextSearchResultSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.string(),
  title: z.string(),
  additionalText: z.string().nullable(),
});
