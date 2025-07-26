import { serverFetch } from '../../createServerInstance';
import { GetTitleResponse, GetTitleRequest } from '@buster/server-shared/title';
import { BASE_URL_V2 } from '../config';

export const getTitle_server = async (params: GetTitleRequest) => {
  return serverFetch<GetTitleResponse>(`/title`, {
    method: 'GET',
    params,
    baseURL: BASE_URL_V2
  });
};
