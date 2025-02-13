'use client';

import { type UseQueryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import type {
  BusterSocketRequestConfig,
  BusterSocketRequestRoute,
  BusterSocketResponseConfig,
  InferBusterSocketRequestPayload,
  InferBusterSocketResponseData
} from './types';

export function useSocketQueryMutation<
  TRequestRoute extends BusterSocketRequestRoute,
  TRoute extends BusterSocketResponseRoute,
  TError = unknown,
  TData = InferBusterSocketResponseData<TRoute>,
  TPayload = InferBusterSocketRequestPayload<TRequestRoute>,
  TQueryData = unknown
>(
  socketRequest: BusterSocketRequestConfig<TRequestRoute>,
  socketResponse: BusterSocketResponseConfig<TRoute>,
  options?: UseQueryOptions<TQueryData, any, TQueryData, any>,
  preCallback?: (
    currentData: TQueryData | null,
    variables: TPayload
  ) => TQueryData | Promise<TQueryData>,
  callback?: (
    newData: InferBusterSocketResponseData<TRoute>,
    currentData: TQueryData | null
  ) => TQueryData
) {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();

  const mutationFn = useMemoizedFn(async (variables: TPayload): Promise<TData> => {
    const queryKey = options?.queryKey;

    if (queryKey && preCallback) {
      const currentData = queryClient.getQueryData<TQueryData>(queryKey) ?? null;
      const transformedData = await preCallback(currentData, variables);
      queryClient.setQueryData(queryKey, transformedData);
    }

    try {
      const result = await busterSocket.emitAndOnce({
        emitEvent: {
          route: socketRequest.route,
          payload: variables
        } as BusterSocketRequest,
        responseEvent: {
          route: socketResponse.route,
          onError: socketResponse.onError,
          callback: (d: unknown) => d
        } as BusterSocketResponse
      });

      if (queryKey && callback) {
        const socketData = result as InferBusterSocketResponseData<TRoute>;
        const currentData = queryClient.getQueryData<TQueryData>(queryKey) ?? null;
        const transformedData = callback(socketData, currentData);
        queryClient.setQueryData(queryKey, transformedData);
        return result as TData;
      }

      return result as TData;
    } catch (error) {
      throw error;
    }
  });

  return useMutation<TData, TError, TPayload>({
    mutationFn
  });
}
