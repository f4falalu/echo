import type { OrganizationRole } from '@buster/server-shared/organization';

export interface OrganizationUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  status: 'active' | 'inactive';
  role: OrganizationRole;
  datasets: OrganizationUserDataset[];
}

export interface OrganizationUserDataset {
  can_query: boolean;
  id: string;
  name: string;
  lineage: {
    name: string;
    id: string;
    type: 'user' | 'datasets' | 'permissionGroups';
  }[][];
}
