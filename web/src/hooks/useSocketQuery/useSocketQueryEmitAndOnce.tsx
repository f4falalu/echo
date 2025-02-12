import { QueryKey, UseQueryOptions } from '@tanstack/react-query';
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
import { useCreateReactQuery } from '@/api/createReactQuery';
import { createQueryKey } from './helpers';
import { useMemo } from 'react';

export function useSocketQueryEmitAndOnce<
  TRoute extends BusterSocketResponseRoute,
  TError = unknown
>(
  socketRequest: BusterSocketRequest,
  socketResponse: BusterSocketResponseConfig<TRoute>,
  options?: Partial<Omit<UseQueryOptions<InferBusterSocketResponseData<TRoute>, TError>, 'queryFn'>>
): UseBusterSocketQueryResult<InferBusterSocketResponseData<TRoute>, TError> {
  const busterSocket = useBusterWebSocket();

  const queryKey = useMemo(
    () => options?.queryKey || createQueryKey(socketResponse, socketRequest),
    [options?.queryKey, socketResponse?.route, socketRequest?.route]
  );

  const queryFn = async (): Promise<InferBusterSocketResponseData<TRoute>> => {
    try {
      const result = await busterSocket.emitAndOnce({
        emitEvent: socketRequest,
        responseEvent: {
          route: socketResponse.route,
          onError: socketResponse.onError,
          callback: (d: unknown) => d
        } as BusterSocketResponse
      });

      return result as InferBusterSocketResponseData<TRoute>;
    } catch (error) {
      throw error;
    }
  };

  return useCreateReactQuery<InferBusterSocketResponseData<TRoute>, TError>({
    queryKey,
    queryFn,
    isUseSession: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    options
  });
}
