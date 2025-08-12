import type { QueryClient, queryOptions } from '@tanstack/react-query';

export const isQueryStale = (
  // biome-ignore lint/suspicious/noExplicitAny: it is any for now
  options: ReturnType<typeof queryOptions<any, any, any>>,
  queryClient: QueryClient
): boolean => {
  const queryState = queryClient.getQueryState(options.queryKey);

  const updatedAt = queryState?.dataUpdatedAt;
  const staleTime =
    (options.staleTime as number) ||
    (queryClient.getDefaultOptions().queries?.staleTime as number) ||
    0;
  const isStale = updatedAt ? Date.now() - updatedAt > staleTime : true;

  return isStale && queryState?.fetchStatus !== 'fetching';
};
