import { userOrganizationRoleEnum } from '@buster/database';
import { z } from 'zod/v4';

export const OrganizationRoleSchema = z.enum([...userOrganizationRoleEnum.enumValues, 'none']);

export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;
