import { BASE_URL } from '@/api/buster_rest/config';
import type {
  OrganizationUser,
  BusterUserResponse,
  BusterUserFavorite,
  BusterUserListItem
} from '@/api/asset_interfaces/users';
import type {
  UserRequestUserListPayload,
  UsersFavoritePostPayload
} from '@/api/request_interfaces/user/interfaces';
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
    try {
      //If Anonymous user, it will fail, so we catch the error and return undefined
      const res = await serverFetch<BusterUserResponse>(`/users`, {
        method: 'GET'
      });
      return res;
    } catch (error) {
      return undefined;
    }
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
  return mainApi.post<null>(`/users/invite`, {
    emails,
    team_ids
  });
};

//USER FAVORITES

export const getUserFavorites = async () => {
  return mainApi.get<BusterUserFavorite[]>(`/users/favorites`).then((response) => response.data);
};

export const getUserFavorites_server = async () => {
  return serverFetch<BusterUserFavorite[]>(`/users/favorites`);
};

export const createUserFavorite = async (payload: UsersFavoritePostPayload) => {
  return mainApi
    .post<BusterUserFavorite[]>(`/users/favorites`, payload)
    .then((response) => response.data);
};

export const createUserFavorite_server = async (payload: UsersFavoritePostPayload) => {
  return serverFetch<BusterUserFavorite[]>(`/users/favorites`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const deleteUserFavorite = async (id: string) => {
  return mainApi
    .delete<BusterUserFavorite[]>(`/users/favorites/${id}`)
    .then((response) => response.data);
};

export const deleteUserFavorite_server = async (id: string) => {
  return serverFetch<BusterUserFavorite[]>(`/users/favorites/${id}`, {
    method: 'DELETE'
  });
};

export const updateUserFavorites = async (payload: string[]) => {
  return mainApi
    .put<BusterUserFavorite[]>(`/users/favorites`, payload)
    .then((response) => response.data);
};

export const updateUserFavorites_server = async (payload: string[]) => {
  return serverFetch<BusterUserFavorite[]>(`/users/favorites`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

//USER LIST

export const getUserList = async (payload: UserRequestUserListPayload) => {
  return mainApi
    .get<BusterUserListItem[]>(`/users`, { params: payload })
    .then((response) => response.data);
};

export const getUserList_server = async (payload: UserRequestUserListPayload) => {
  return serverFetch<BusterUserListItem[]>(`/users`, { params: payload });
};
