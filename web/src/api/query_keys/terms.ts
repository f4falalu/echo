import { queryOptions } from '@tanstack/react-query';
import type { BusterTerm, BusterTermListItem } from '@/api/asset_interfaces';

export const termsGetList = queryOptions<BusterTermListItem[]>({
  queryKey: ['terms', 'list'] as const,
  staleTime: 10 * 1000
});

export const termsGetTerm = (termId: string) =>
  queryOptions<BusterTerm>({
    queryKey: ['terms', 'get', termId] as const,
    staleTime: 10 * 1000
  });

export const termsQueryKeys = {
  termsGetList,
  termsGetTerm
};
