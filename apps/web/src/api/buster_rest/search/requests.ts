import type { SearchTextRequest, SearchTextResponse } from '@buster/server-shared/search';
import { mainApiV2 } from '../instances';

export const search = async (params: SearchTextRequest) => {
  return mainApiV2.get<SearchTextResponse>('/search', { params }).then((res) => res.data);
};
