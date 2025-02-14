import { queryOptions } from '@tanstack/react-query';
import type { BusterSearchResult } from './interfaces';

export const getSearchResult = (searchTerm: string) =>
  queryOptions<BusterSearchResult[]>({
    queryKey: ['search', 'results', searchTerm] as const,
    staleTime: 1000 * 20 // 20 seconds
  });

export const searchQueryKeys = {
  '/search/results:getSearchResult': getSearchResult
};
