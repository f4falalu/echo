import type { OrganizationRole } from '@buster/server-shared/organization';

export const OrganizationUserRoleText: Record<
  OrganizationRole,
  {
    title: string;
    description: string;
  }
> = {
  viewer: {
    title: 'Viewer',
    description: 'Can only view metrics that have been shared with them.'
  },
  restricted_querier: {
    title: 'Restricted Querier',
    description: 'Can only query datasets that have been provisioned to them.'
  },
  querier: {
    title: 'Querier',
    description: 'Can query all datasets associated with the workspace.'
  },
  data_admin: {
    title: 'Data Admin',
    description: 'Full access, except for billing.'
  },
  workspace_admin: {
    title: 'Workspace Admin',
    description: 'Full access, including billing.'
  }
};
