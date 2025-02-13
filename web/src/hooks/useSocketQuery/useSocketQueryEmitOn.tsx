import {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  BusterSocketResponseConfig,
  InferBusterSocketResponseData,
  UseBusterSocketQueryResult
} from './types';
import { useSockeQueryOn } from './useSocketQueryOn';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn, useMount } from 'ahooks';
import { createQueryKey } from './helpers';
import { useEffect } from 'react';

/**
 * A hook that emits a socket request on mount and listens for responses.
 *
 * @template TRoute - The type of socket response route
 * @template TError - The type of error that can occur
 *
 * @param socketRequest - The socket request to emit
 * @param socketResponse - Configuration for the socket response including route and error handler
 * @param options - Additional options for the React Query hook
 *
 * @returns A React Query result containing the response data and status
 */
export const useSocketQueryEmitOn = <TRoute extends BusterSocketResponseRoute, TError = unknown>(
  socketRequest: BusterSocketRequest,
  socketResponse: BusterSocketResponseConfig<TRoute>,
  optionsProps?: Omit<
    UseQueryOptions<InferBusterSocketResponseData<TRoute>, TError>,
    'queryKey' | 'queryFn'
  > & { enabled?: boolean | string }
): UseBusterSocketQueryResult<InferBusterSocketResponseData<TRoute>, TError> => {
  const busterSocket = useBusterWebSocket();
  const { enabled = true, ...options } = optionsProps || {};

  const queryKey = createQueryKey(socketResponse, socketRequest);

  const queryFn = useMemoizedFn(async () => {
    const res = await busterSocket.emitAndOnce({
      emitEvent: socketRequest,
      responseEvent: {
        ...socketResponse,
        callback: (d: unknown) => d
      } as BusterSocketResponse
    });

    return res;
  }) as () => Promise<InferBusterSocketResponseData<TRoute>>;

  useEffect(() => {
    if (enabled) {
      queryFn();
    }
  }, [enabled]);

  return useSockeQueryOn(socketResponse, {
    ...options,
    queryKey,
    queryFn
  });
};
