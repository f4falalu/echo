import type { organizations } from '@buster/database';
import { z } from 'zod';
import type { IsEqual } from '../type-utilities';
import { OrganizationRoleSchema } from './roles.types';

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  paymentRequired: z.boolean(),
  domains: z.array(z.string()).nullable(),
  restrictNewUserInvitations: z.boolean(),
  defaultRole: OrganizationRoleSchema,
});

export type Organization = z.infer<typeof OrganizationSchema>;

type _DBEqualityCheck = IsEqual<Organization, typeof organizations.$inferSelect>;
