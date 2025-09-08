import type { OrganizationUser } from '@buster/server-shared/organization';
import type { UserResponse } from '@buster/server-shared/user';
import { BASE_URL } from '@/api/config';
import { mainApi } from '../instances';

export const getMyUserInfo = async () => {
  return mainApi.get<UserResponse>('/users').then((response) => response.data);
};

export const getUser = async ({ userId }: { userId: string }) => {
  return mainApi.get<OrganizationUser>(`/users/${userId}`).then((response) => response.data);
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
  team_ids,
}: {
  emails: string[];
  team_ids?: string[];
}) => {
  return mainApi.post<null>('/users/invite', {
    emails,
    team_ids,
  });
};
