'use client';

import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BusterSocketResponse, BusterSocketResponseRoute } from '@/api/buster_socket';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import type {
  UseBusterSocketQueryResult,
  InferBusterSocketResponseData,
  BusterSocketResponseConfig
} from './types';
import { useMount } from 'ahooks';

export const useBusterWebSocketOn = <TRoute extends BusterSocketResponseRoute, TError = unknown>(
  queryKey: QueryKey,
  socketResponse: BusterSocketResponseConfig<TRoute>
): UseBusterSocketQueryResult<InferBusterSocketResponseData<TRoute>, TError> => {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();

  useMount(() => {
    busterSocket.on({
      route: socketResponse.route,
      onError: socketResponse.onError,
      callback: (d: unknown) => {
        queryClient.setQueryData(queryKey, d as InferBusterSocketResponseData<TRoute>);
        queryClient.invalidateQueries({ queryKey });
      }
    } as BusterSocketResponse);
  });

  return useQuery({
    queryKey
  });
};

const ExampleUsage = () => {
  const { data, isFetched } = useBusterWebSocketOn(['chats', 'get', '123'], {
    route: '/chats/get:getChat'
  });
};
