import type {
  Organization,
  OrganizationUser,
  UpdateOrganizationRequest,
  UpdateOrganizationResponse,
} from '@buster/server-shared/organization';
import { mainApi, mainApiV2 } from '../instances';

export const getOrganizationUsers = async ({
  organizationId,
}: {
  organizationId: string;
}): Promise<OrganizationUser[]> => {
  return mainApi
    .get<OrganizationUser[]>(`/organizations/${organizationId}/users`)
    .then((response) => response.data);
};

export const createOrganization = async (organization: { name: string }) => {
  return mainApi.post<Organization>('/organizations', organization).then((res) => res.data);
};

export const updateOrganization = async (organization: UpdateOrganizationRequest) => {
  return mainApiV2
    .put<UpdateOrganizationResponse>('/organizations', organization)
    .then((res) => res.data);
};
