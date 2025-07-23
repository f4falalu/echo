import { z } from 'zod';

export const GetTitleRequestSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.enum(['chat', 'metric', 'collection', 'dashboard']),
});

export type GetTitleRequest = z.infer<typeof GetTitleRequestSchema>;
