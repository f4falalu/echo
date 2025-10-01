import type { SearchTextResponse } from '@buster/server-shared/search';
import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/api/errors';
import { searchQueryKeys } from '@/api/query_keys/search';
import { search } from './requests';

export const useSearch = <T = SearchTextResponse>(
  params: Parameters<typeof search>[0],
  options?: Omit<UseQueryOptions<SearchTextResponse, ApiError, T>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SearchTextResponse, ApiError, T>({
    ...searchQueryKeys.getSearchResult(params),
    queryFn: ({ signal }) => search(params, signal),
    select: options?.select,
    ...options,
    placeholderData: keepPreviousData,
  });
};
