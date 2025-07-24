import { serverFetch } from '../../createServerInstance';
import { GetTitleResponse, GetTitleRequest } from '@buster/server-shared/title';

export const getTitle_server = async (params: GetTitleRequest) => {
  return serverFetch<GetTitleResponse>(`/title`, {
    method: 'GET',
    params
  });
};
