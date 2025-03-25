import { mainApi } from '../instances';
import { BusterSearchResult } from '@/api/asset_interfaces/search';

/**
 * Performs a search across various entities in the Buster system
 * @param params Search parameters
 * @returns Array of search results
 */
export const search = async (params: {}) => {
  const { ...allParams } = params;
  return mainApi
    .get<BusterSearchResult[]>('/search', { params: { ...allParams } })
    .then((res) => res.data);
};
