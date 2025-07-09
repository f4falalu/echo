import type { userOrganizationRoleEnum } from '@buster/database'; //we import as type to avoid postgres dependency in the frontend ☹️
import { z } from 'zod/v4';

type UserOrganizationRoleBase = (typeof userOrganizationRoleEnum.enumValues)[number] | 'none';

const UserOrganizationRoleEnums: Record<UserOrganizationRoleBase, UserOrganizationRoleBase> =
  Object.freeze({
    none: 'none',
    viewer: 'viewer',
    workspace_admin: 'workspace_admin',
    data_admin: 'data_admin',
    querier: 'querier',
    restricted_querier: 'restricted_querier',
  });

export const UserOrganizationRoleSchema = z.enum(Object.values(UserOrganizationRoleEnums));

export type UserOrganizationRole = z.infer<typeof UserOrganizationRoleSchema>;
