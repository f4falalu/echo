import { z } from 'zod/v4';
import { OrganizationSchema } from '../organization/organization.types';
import { OrganizationRoleSchema } from '../organization/roles.types';
import { TeamSchema } from '../teams/teams.types';
import { UserFavoriteSchema } from './favorites.types';
import { UserSchema } from './users.types';

export const UserResponseSchema = z.object({
  user: UserSchema,
  teams: z.array(TeamSchema),
  organizations: z.array(OrganizationSchema).nullable(),
});

export const UserListResponseSchema = z.array(
  z.object({
    email: z.string(),
    id: z.string(),
    name: z.string(),
    role: OrganizationRoleSchema.nullable(),
  })
);

export const UserFavoriteResponseSchema = z.array(UserFavoriteSchema);

export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type UserFavoriteResponse = z.infer<typeof UserFavoriteResponseSchema>;
