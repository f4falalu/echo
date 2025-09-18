import { z } from 'zod';
import { UserOrganizationRoleSchema, UserOrganizationStatusSchema } from '../organization';

export const OrganizationUserSchema = z.object({
  email: z.string(),
  id: z.string(),
  name: z.string().nullable(),
  role: UserOrganizationRoleSchema.nullable(),
  avatarUrl: z.string().nullable(),
  status: UserOrganizationStatusSchema,
});

export type OrganizationUser = z.infer<typeof OrganizationUserSchema>;
