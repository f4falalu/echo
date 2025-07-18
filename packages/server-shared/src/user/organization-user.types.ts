import { z } from 'zod';
import { OrganizationRoleSchema, OrganizationStatusSchema } from '../organization';

export const OrganizationUserSchema = z.object({
  email: z.string(),
  id: z.string(),
  name: z.string().nullable(),
  role: OrganizationRoleSchema.nullable(),
  avatarUrl: z.string().nullable(),
  status: OrganizationStatusSchema,
});

export type OrganizationUser = z.infer<typeof OrganizationUserSchema>;
