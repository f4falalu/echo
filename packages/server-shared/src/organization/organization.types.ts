import { z } from 'zod';
import { OrganizationRoleSchema } from './roles.types';

export const OrganizationSchema = z.object({
  created_at: z.string(),
  id: z.string(),
  deleted_at: z.string().nullable(),
  domain: z.string(),
  name: z.string(),
  updated_at: z.string(),
  role: OrganizationRoleSchema,
});

export type Organization = z.infer<typeof OrganizationSchema>;
