import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchQueryKeys } from '@/api/query_keys/search';
import { search } from './requests';

export const useSearch = (params: Parameters<typeof search>[0]) => {
  return useQuery({
    ...searchQueryKeys.getSearchResult(params),
    queryFn: () => search(params),
    placeholderData: keepPreviousData
  });
};
