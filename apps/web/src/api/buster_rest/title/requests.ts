import type { GetTitleRequest, GetTitleResponse } from '@buster/server-shared/title';
import { mainApiV2 } from '../instances';

export const getTitle = async (params: GetTitleRequest) => {
  return mainApiV2
    .get<GetTitleResponse>('/title', { params })
    .then((res) => res.data.title)
    .catch(() => undefined);
};
