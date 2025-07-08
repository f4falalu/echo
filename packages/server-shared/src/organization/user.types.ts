import { z } from 'zod/v4';
import { OrganizationRoleSchema } from './roles.types';

export const LineageUserItemTypeSchema = z.enum(['user', 'datasets', 'permissionGroups']);

// Zod schema for lineage item
const LineageItemSchema = z.object({
  name: z.string(),
  id: z.string(),
  type: LineageUserItemTypeSchema,
});

// Zod schema for OrganizationUserDataset
export const OrganizationUserDatasetSchema = z.object({
  can_query: z.boolean(),
  id: z.string(),
  name: z.string(),
  lineage: z.array(z.array(LineageItemSchema)),
});

// Zod schema for OrganizationUser
export const OrganizationUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  avatar_url: z.string().nullable(),
  status: z.enum(['active', 'inactive']),
  role: OrganizationRoleSchema,
  datasets: z.array(OrganizationUserDatasetSchema),
});

// Export inferred types
export type OrganizationUser = z.infer<typeof OrganizationUserSchema>;
export type OrganizationUserDataset = z.infer<typeof OrganizationUserDatasetSchema>;
export type LinageUserItemType = z.infer<typeof LineageUserItemTypeSchema>;
export type LinageUserItem = z.infer<typeof LineageItemSchema>;
