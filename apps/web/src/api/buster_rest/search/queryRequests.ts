import type { SearchTextResponse } from '@buster/server-shared/search';
import {
  keepPreviousData,
  type UseQueryOptions,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { useState } from 'react';
import type { ApiError } from '@/api/errors';
import { getSearchResultInfinite, searchQueryKeys } from '@/api/query_keys/search';
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

export const useSearchInfinite = (
  params: Pick<Parameters<typeof search>[0], 'page_size' | 'assetTypes'> = {
    page_size: 5,
    assetTypes: ['chat'],
  }
) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const queryResult = useInfiniteQuery({
    queryKey: ['search', 'results', 'infinite', params] as const,
    staleTime: 1000 * 30, // 30 seconds,
    queryFn: ({ pageParam = 1 }) => search({ query: searchQuery, page: pageParam, ...params }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.has_more) {
        return undefined;
      }
      return lastPage.pagination.page + 1;
    },
    initialPageParam: 1,
  });

  return { ...queryResult, setSearchQuery, searchQuery };
};
