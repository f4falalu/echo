import { z } from 'zod';
import { AssetTypeSchema } from '../assets';

export const AddAndRemoveFromCollectionResponseSchema = z.object({
  failed_assets: z.array(
    z.object({
      type: AssetTypeSchema,
      id: z.string(),
      error: z.string(),
    })
  ),
  failed_count: z.number(),
  message: z.string(),
  removed_count: z.number(),
});

export type AddAndRemoveFromCollectionResponse = z.infer<
  typeof AddAndRemoveFromCollectionResponseSchema
>;
