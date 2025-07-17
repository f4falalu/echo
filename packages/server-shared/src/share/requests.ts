import { z } from 'zod';
import { ShareRoleSchema } from './share-interfaces.types';

export const SharePostRequestSchema = z.array(
  z.object({
    email: z.string().email(),
    role: ShareRoleSchema,
    avatar_url: z.string().nullable().optional(),
    name: z.string().optional(),
  })
);

export type SharePostRequest = z.infer<typeof SharePostRequestSchema>;
