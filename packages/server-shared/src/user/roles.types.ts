import { userOrganizationRoleEnum } from '@buster/database';
import { z } from 'zod/v4';

export const UserOrganizationRoleSchema = z.enum([...userOrganizationRoleEnum.enumValues, 'none']);

export type UserOrganizationRole = z.infer<typeof UserOrganizationRoleSchema>;
