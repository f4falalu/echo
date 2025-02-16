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
import { useEffect } from 'react';
import { useMemoizedFn } from 'ahooks';
import { useSocketQueryOn } from './useSocketQueryOn';

export const useSocketQueryEmitOn = <
  TRoute extends BusterSocketResponseRoute,
  TError = unknown,
  TData = InferBusterSocketResponseData<TRoute>,
  TQueryKey extends QueryKey = QueryKey
>(
  socketRequest: BusterSocketRequest,
  socketResponse: TRoute,
  options: UseQueryOptions<TData, TError, TData, TQueryKey>,
  callback?:
    | ((currentData: TData | null, newData: InferBusterSocketResponseData<TRoute>) => TData)
    | null,
  enabledTriggerProp?: boolean | string
) => {
  const queryClient = useQueryClient();
  const busterSocket = useBusterWebSocket();
  const enabledTrigger = enabledTriggerProp ?? true;

  // Use mutation for deduped socket emissions
  const { mutate: emitQueryFn } = useMutation({
    mutationKey: ['socket-emit', ...options.queryKey],
    mutationFn: async () => {
      busterSocket.emit(socketRequest);
      return null;
    }
  });

  const queryResult = useSocketQueryOn(socketResponse, options, callback);

  useEffect(() => {
    const queryState = queryClient.getQueryState(options.queryKey);
    const staleTime = (options.staleTime as number) ?? 0;
    const isStale =
      !queryState?.dataUpdatedAt || Date.now() - queryState.dataUpdatedAt >= staleTime;

    if (enabledTrigger && (isStale || !queryState)) {
      emitQueryFn();
    }
  }, [enabledTrigger]);

  return { ...queryResult, refetch: emitQueryFn };
};
