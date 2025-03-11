import { queryOptions } from '@tanstack/react-query';
import type { BusterSearchResult } from '@/api/asset_interfaces/search';

export const getSearchResult = (searchTerm: string) =>
  queryOptions<BusterSearchResult[]>({
    queryKey: ['search', 'results', searchTerm] as const,
    staleTime: 1000 * 30 // 30 seconds
  });

export const searchQueryKeys = {
  getSearchResult
};
