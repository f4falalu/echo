import type { BusterSocketResponseRoute, BusterSocketRequest } from '@/api/buster_socket';
import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
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
  callback?: (currentData: TData | null, newData: InferBusterSocketResponseData<TRoute>) => TData,
  enabledTriggerProp?: boolean | string
) => {
  const busterSocket = useBusterWebSocket();
  const enabledTrigger = enabledTriggerProp ?? true;

  const emitQueryFn = useMemoizedFn(async () => {
    busterSocket.emit(socketRequest);
  });

  useEffect(() => {
    if (enabledTrigger) {
      emitQueryFn();
    }
  }, [enabledTrigger]);

  const queryResult = useSocketQueryOn(socketResponse, options, callback);

  return { ...queryResult, refetch: emitQueryFn };
};
