import { z } from 'zod';

export const GetScreenshotRequestSharedSchema = z.object({});

export type GetScreenshotRequestShared = z.infer<typeof GetScreenshotRequestSharedSchema>;
