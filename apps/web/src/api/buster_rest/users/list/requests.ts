import { serverFetch } from '../../../createServerInstance';
import { mainApi } from '../../instances';
import type { UserListResponse } from '@buster/server-shared/user';

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
