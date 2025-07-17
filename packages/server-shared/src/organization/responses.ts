import type { z } from 'zod';
import { OrganizationSchema } from './organization.types';

export const UpdateOrganizationResponseSchema = OrganizationSchema;

export type UpdateOrganizationResponse = z.infer<typeof UpdateOrganizationResponseSchema>;
