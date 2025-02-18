import { BASE_URL } from '@/api/buster_rest/instances';
import type { OrganizationUser, BusterUserResponse } from '@/api/asset_interfaces';
import { mainApi } from '../instances';
import { serverFetch } from '../../createServerInstance';

export const getMyUserInfo = async (): Promise<BusterUserResponse> => {
  return mainApi.get<BusterUserResponse>(`/users`).then((response) => response.data);
};

export const getMyUserInfo_server = async ({
  jwtToken
}: {
  jwtToken: string | undefined;
}): Promise<BusterUserResponse | undefined> => {
  if (!jwtToken) {
    const res = await serverFetch<BusterUserResponse>(`/users`, {
      method: 'GET'
    });
    return res;
  }

  //use fetch instead of serverFetch because...
  return fetch(`${BASE_URL}/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`
    }
  })
    .then((response) => {
      if (!response.ok) {
        return undefined;
      }
      return response.json();
    })
    .catch((error) => {
      return undefined;
    });
};

export const getUser = async ({ userId }: { userId: string }) => {
  return mainApi.get<OrganizationUser>(`/users/${userId}`).then((response) => response.data);
};

export const getUser_server = async ({ userId }: { userId: string }) => {
  return serverFetch<OrganizationUser>(`/users/${userId}`);
};

export const updateOrganizationUser = async ({
  userId,
  ...params
}: {
  userId: string;
  name?: string;
  role?: OrganizationUser['role'];
}) => {
  return mainApi
    .put<OrganizationUser>(`/users/${userId}`, params)
    .then((response) => response.data);
};

export const inviteUser = async ({
  emails,
  team_ids
}: {
  emails: string[];
  team_ids?: string[];
}) => {
  return mainApi.post(`/users/invite`, {
    emails,
    team_ids
  });
};
