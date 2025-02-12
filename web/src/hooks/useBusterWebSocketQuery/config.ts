import { UseQueryOptions } from '@tanstack/react-query';

export const DEFAULT_OPTIONS: Partial<UseQueryOptions> = {
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  retry: 0,
  staleTime: 0
};
