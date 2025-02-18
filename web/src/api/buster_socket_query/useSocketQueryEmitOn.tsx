import type { BusterSocketResponseRoute, BusterSocketRequest } from '@/api/buster_socket';
import {
  queryOptions,
  useQueryClient,
  useMutation,
  type QueryKey,
  type UseQueryOptions
} from '@tanstack/react-query';
import type { InferBusterSocketResponseData } from './types';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useEffect, useMemo } from 'react';
import { useSocketQueryOn } from './useSocketQueryOn';
import { timeout } from '@/utils';

export const useSocketQueryEmitOn = <
  TRoute extends BusterSocketResponseRoute,
  TError = unknown,
  TData = InferBusterSocketResponseData<TRoute>,
  TQueryKey extends QueryKey = QueryKey
>({
  emitEvent,
  responseEvent,
  options,
  callback,
  enabledTrigger: enabledTriggerProp
}: {
  emitEvent: BusterSocketRequest;
  responseEvent: TRoute;
  options: UseQueryOptions<TData, TError, TData, TQueryKey>;
  callback?:
    | ((currentData: TData | null, newData: InferBusterSocketResponseData<TRoute>) => TData)
    | null;
  enabledTrigger?: boolean | string;
}) => {
  const queryClient = useQueryClient();
  const busterSocket = useBusterWebSocket();
  const enabledTrigger = enabledTriggerProp ?? true;

  const mutationKey = useMemo(() => {
    return ['socket-emit', ...options.queryKey];
  }, [options.queryKey]);

  console.log(mutationKey);

  // Use mutation for deduped socket emissions
  const { mutateAsync: emitQueryFn } = useMutation({
    mutationKey,
    mutationFn: async () => {
      busterSocket.emit(emitEvent);
      await timeout(250);
      return null;
    }
  });

  const queryResult = useSocketQueryOn({ responseEvent, options, callback });

  useEffect(() => {
    const queryState = queryClient.getQueryState(options.queryKey);
    const staleTime = (options.staleTime as number) ?? 0;
    const isStale =
      !queryState?.dataUpdatedAt || Date.now() - queryState.dataUpdatedAt >= staleTime;

    console.log(isStale, queryState);

    if (enabledTrigger && (isStale || !queryState)) {
      emitQueryFn();
    }
  }, [enabledTrigger]);

  return { ...queryResult, refetch: emitQueryFn };
};
