import type { ShareAssetType } from '@buster/server-shared/share';
import type { OrganizationUser } from '@/api/asset_interfaces/users';
import { BASE_URL } from '../config';
import { serverFetch } from '../../createServerInstance';
import { mainApi } from '../instances';
import type {
  UserResponse,
  UserFavoriteResponse,
  UserListResponse
} from '@buster/server-shared/user';

export const getMyUserInfo = async () => {
  return mainApi.get<UserResponse>('/users').then((response) => response.data);
};

export const getMyUserInfo_server = async ({
  jwtToken
}: {
  jwtToken: string | undefined;
}): Promise<UserResponse | null> => {
  if (!jwtToken) {
    //If Anonymous user, it will fail, so we catch the error and return undefined
    return await serverFetch<UserResponse>('/users', {
      method: 'GET'
    });
  }

  //use fetch instead of serverFetch because...
  return fetch(`${BASE_URL}/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`
    }
  }).then(async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw {
        status: response.status,
        statusText: response.statusText,
        ...errorData
      };
    }
    return (await response.json()) as UserResponse;
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
  return mainApi.post<null>('/users/invite', {
    emails,
    team_ids
  });
};

//USER FAVORITES

export const getUserFavorites = async () => {
  return mainApi.get<UserFavoriteResponse>('/users/favorites').then((response) => response.data);
};

export const getUserFavorites_server = async () => {
  return serverFetch<UserFavoriteResponse>('/users/favorites');
};

export const createUserFavorite = async (
  payload: {
    id: string;
    asset_type: ShareAssetType;
    index?: number;
    name: string; //just used for the UI for optimistic update
  }[]
) => {
  return mainApi
    .post<UserFavoriteResponse>('/users/favorites', payload)
    .then((response) => response.data);
};

export const deleteUserFavorite = async (data: string[]) => {
  return mainApi
    .delete<UserFavoriteResponse>('/users/favorites', { data })
    .then((response) => response.data);
};

export const updateUserFavorites = async (payload: string[]) => {
  return mainApi
    .put<UserFavoriteResponse>('/users/favorites', payload)
    .then((response) => response.data);
};

//USER LIST

export const getUserList = async (payload: {
  team_id: string;
  page?: number;
  page_size?: number;
}) => {
  return mainApi
    .get<UserListResponse>('/users', { params: payload })
    .then((response) => response.data);
};

export const getUserList_server = async (payload: Parameters<typeof getUserList>[0]) => {
  return serverFetch<UserListResponse>('/users', { params: payload });
};
