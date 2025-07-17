import type { z } from 'zod';
import { OrganizationSchema } from './organization.types';

export const GetOrganizationResponseSchema = OrganizationSchema;

export type GetOrganizationResponse = z.infer<typeof GetOrganizationResponseSchema>;

export const UpdateOrganizationResponseSchema = OrganizationSchema;

export type UpdateOrganizationResponse = z.infer<typeof UpdateOrganizationResponseSchema>;
