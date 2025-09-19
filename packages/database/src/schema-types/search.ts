import z from 'zod';

export const TextSearchResultSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.string(),
  searchableText: z.string(),
});
