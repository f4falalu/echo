import type { UpdateUserResponse, UserInfoByIdResponse } from '@buster/database';
import { UserPersonalizationConfigSchema } from '@buster/database/schema-types';
import { z } from 'zod';
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

export const UserPatchRequestSchema = z.object({
  name: z.string().optional(),
  personalizationEnabled: z.boolean().optional(),
  personalizationConfig: UserPersonalizationConfigSchema.optional(),
});

export const GetUserByIdRequestSchema = z.object({
  id: z.string().uuid(),
});

export type UserPatchRequest = z.infer<typeof UserPatchRequestSchema>;
export type UserPatchResponse = UpdateUserResponse;
export type User = z.infer<typeof UserSchema>;
export type GetUserByIdRequest = z.infer<typeof GetUserByIdRequestSchema>;
export type GetUserByIdResponse = UserInfoByIdResponse;
