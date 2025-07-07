import { z } from 'zod/v4';
import { OrganizationRoleSchema } from '../organization/roles.types';
import { ShareAssetTypeSchema } from '../share';

export const UserRequestSchema = z.object({
  user_id: z.string(),
});

export type UserRequest = z.infer<typeof UserRequestSchema>;

export const UserUpdateRequestSchema = z.object({
  user_id: z.string(),
  name: z.string().optional(),
  role: OrganizationRoleSchema.optional(),
});

export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;

export const UserInviteRequestSchema = z.object({
  emails: z.array(z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
  team_ids: z.array(z.string()).optional(),
});

export type UserInviteRequest = z.infer<typeof UserInviteRequestSchema>;

export const UserCreateFavoriteRequestSchema = z.object({
  id: z.string(),
  asset_type: ShareAssetTypeSchema,
  index: z.number().optional(),
  name: z.string(),
});

export type UserCreateFavoriteRequest = z.infer<typeof UserCreateFavoriteRequestSchema>;

export const UserDeleteFavoriteRequestSchema = z.array(z.string());

export type UserDeleteFavoriteRequest = z.infer<typeof UserDeleteFavoriteRequestSchema>;

export const UserUpdateFavoriteRequestSchema = z.array(z.string());

export type UserUpdateFavoriteRequest = z.infer<typeof UserUpdateFavoriteRequestSchema>;

export const GetUserListRequestSchema = z.object({
  team_id: z.string(),
  page: z.number().optional(),
  page_size: z.number().optional(),
});

export type GetUserListRequest = z.infer<typeof GetUserListRequestSchema>;
