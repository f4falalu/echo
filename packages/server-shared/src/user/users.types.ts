import { z } from 'zod/v4';
import type { UserFavorite } from './favorites.types';
import type { UserOrganizationRole } from './roles.types';

export const UserSchema = z.object({
  attributes: z.object({
    organization_id: z.string(),
    organization_role: z.custom<UserOrganizationRole>(),
    user_email: z.string().email(),
    user_id: z.string(),
  }),
  created_at: z.string(),
  email: z.string().email(),
  favorites: z.array(z.custom<UserFavorite>()),
  id: z.string(),
  name: z.string(),
  avatar_url: z.string().nullable(),
  updated_at: z.string(),
});

export type User = z.infer<typeof UserSchema>;
