import { useQuery } from '@tanstack/react-query';
import { searchQueryKeys } from '@/api/query_keys/search';
import { search } from './requests';
import type { SearchParams } from '@/api/request_interfaces/search/interfaces';

/**
 * React Query hook for performing searches
 * @param params Search parameters
 * @returns Query result containing search data and status
 */
export const useSearch = (params: SearchParams) => {
  const res = useQuery({
    ...searchQueryKeys.getSearchResult(params.query),
    queryFn: () => search(params)
  });

  return {
    ...res,
    data: res.data || []
  };
};
