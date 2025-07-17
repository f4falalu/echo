import type { OrganizationRole } from '@buster/server-shared/organization';
import { OrganizationRoleEnum } from '@buster/server-shared/organization';

export const isOrganizationAdmin = (role: OrganizationRole) => {
  return role === OrganizationRoleEnum.workspace_admin || role === OrganizationRoleEnum.data_admin;
};
