import { z } from 'zod';

export const AssetIdParamsSchema = z.object({
  id: z.string().uuid('Asset ID must be a valid UUID'),
});

export const PutScreenshotRequestSchema = z.object({
  base64Image: z.string().min(1, 'Base64 image is required'),
});

export type PutScreenshotRequest = z.infer<typeof PutScreenshotRequestSchema>;

export const PutScreenshotResponseSchema = z.object({
  success: z.literal(true),
  bucketKey: z.string().min(1, 'Bucket key is required'),
});

export type PutScreenshotResponse = z.infer<typeof PutScreenshotResponseSchema>;

export const GetScreenshotResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url(),
});

export type GetScreenshotResponse = z.infer<typeof GetScreenshotResponseSchema>;
