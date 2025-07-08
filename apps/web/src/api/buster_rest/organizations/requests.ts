import { serverFetch } from '../../createServerInstance';
import { mainApi } from '../instances';
import type { Organization, OrganizationUser } from '@buster/server-shared/organization';

export const getOrganizationUsers = async ({
  organizationId
}: {
  organizationId: string;
}): Promise<OrganizationUser[]> => {
  return mainApi
    .get<OrganizationUser[]>(`/organizations/${organizationId}/users`)
    .then((response) => response.data);
};

export const getOrganizationUsers_server = async ({
  organizationId
}: {
  organizationId: string;
}): Promise<OrganizationUser[]> => {
  return serverFetch<OrganizationUser[]>(`/organizations/${organizationId}/users`);
};

export const createOrganization = async (organization: { name: string }) => {
  return mainApi.post<Organization>('/organizations', organization).then((res) => res.data);
};
