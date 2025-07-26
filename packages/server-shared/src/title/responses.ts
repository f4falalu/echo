import { z } from 'zod';

export const GetTitleResponseSchema = z.object({
  title: z.string(),
});

export type GetTitleResponse = z.infer<typeof GetTitleResponseSchema>;
