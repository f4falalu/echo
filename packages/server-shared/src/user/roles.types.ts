import type { userOrganizationRoleEnum } from '@buster/database'; //we import as type to avoid postgres dependency in the frontend ☹️
import { z } from 'zod';

type UserOrganizationRoleBase = (typeof userOrganizationRoleEnum.enumValues)[number];

const UserOrganizationRoleEnums: Record<UserOrganizationRoleBase, UserOrganizationRoleBase> =
  Object.freeze({
    viewer: 'viewer',
    workspace_admin: 'workspace_admin',
    data_admin: 'data_admin',
    querier: 'querier',
    restricted_querier: 'restricted_querier',
  });

export const UserOrganizationRoleSchema = z.enum(
  Object.values(UserOrganizationRoleEnums) as [
    UserOrganizationRoleBase,
    ...UserOrganizationRoleBase[],
  ]
);

export type UserOrganizationRole = z.infer<typeof UserOrganizationRoleSchema>;
