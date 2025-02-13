'use client';

import { QueryKey, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import type {
  UseBusterSocketQueryResult,
  InferBusterSocketResponseData,
  BusterSocketResponseConfig
} from './types';
import { useMount } from 'ahooks';
import { createQueryKey } from './helpers';
import { useMemo } from 'react';

export const useSockeQueryOn = <TRoute extends BusterSocketResponseRoute, TError = unknown>(
  socketResponse: BusterSocketResponseConfig<TRoute>,
  options?: {
    queryKey?: QueryKey;
  }
): UseBusterSocketQueryResult<InferBusterSocketResponseData<TRoute>, TError> => {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();

  // const queryKey = useMemo(
  //   () => options?.queryKey || createQueryKey(socketResponse),
  //   [options?.queryKey, socketResponse?.route]
  // );

  useMount(() => {
    busterSocket.on({
      route: socketResponse.route,
      onError: socketResponse.onError,
      callback: (d: unknown) => {
        queryClient.setQueryData(queryKey, d as InferBusterSocketResponseData<TRoute>);
      }
    } as BusterSocketResponse);
  });

  return useQuery({
    queryKey,
    ...options,
    enabled: false //must be disabled to prevent automatic fetching
  });
};
