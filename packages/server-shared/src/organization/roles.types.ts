import type { userOrganizationRoleEnum } from '@buster/database'; //we import as type to avoid postgres dependency in the frontend ☹️
import { z } from 'zod/v4';

type OrganizationRoleBase = (typeof userOrganizationRoleEnum.enumValues)[number] | 'none';

//We need this to avoid postgres dependency in the frontend ☹️
export const OrganizationRoleEnum: Record<OrganizationRoleBase, OrganizationRoleBase> =
  Object.freeze({
    none: 'none',
    viewer: 'viewer',
    workspace_admin: 'workspace_admin',
    data_admin: 'data_admin',
    querier: 'querier',
    restricted_querier: 'restricted_querier',
  });

export const OrganizationRoleSchema = z.enum(Object.values(OrganizationRoleEnum));

export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;
