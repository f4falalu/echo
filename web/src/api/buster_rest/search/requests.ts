import { mainApi } from '../instances';
import { serverFetch } from '@/api/createServerInstance';
import { BusterSearchResult } from '@/api/asset_interfaces/search';
import type { SearchParams } from '@/api/request_interfaces/search/interfaces';

/**
 * Performs a search across various entities in the Buster system
 * @param params Search parameters
 * @returns Array of search results
 */
export const search = async (params: SearchParams) => {
  const { num_results = 15, ...allParams } = params;
  return mainApi
    .get<BusterSearchResult[]>('/search', { params: { num_results, ...allParams } })
    .then((res) => res.data);
};
