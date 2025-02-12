import { UseBusterSocketQueryOptions } from './types';

export const DEFAULT_OPTIONS: Partial<UseBusterSocketQueryOptions<unknown, unknown>> = {
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  retry: 0,
  staleTime: 0
};
