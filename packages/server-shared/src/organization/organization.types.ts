import type { organizations } from '@buster/database';
import { z } from 'zod';
import { OrganizationRoleSchema } from './roles.types';

export const OrganizationColorPaletteSchema = z.object({
  id: z.string(),
  color: z.array(z.string()),
});

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
  organizationColorPalettes: z.array(OrganizationColorPaletteSchema),
});

export type Organization = z.infer<typeof OrganizationSchema>;

// Type equality check - this will cause a compilation error if types don't match
const _organizationTypeCheck: Organization = {} as typeof organizations.$inferSelect;
const _databaseTypeCheck: typeof organizations.$inferSelect = {} as Organization;
