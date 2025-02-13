'use client';

import {
  type QueryFunction,
  type QueryKey,
  type UseQueryOptions,
  type UseMutationOptions,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
import type {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import { queryOptionsConfig } from './queryKeyConfig';
import type {
  BusterSocketRequestConfig,
  BusterSocketRequestRoute,
  BusterSocketResponseConfig,
  InferBusterSocketRequestPayload,
  InferBusterSocketResponseData
} from './types';

export function useSocketMutation<
  TRequestRoute extends BusterSocketRequestRoute,
  TRoute extends BusterSocketResponseRoute,
  TError = unknown,
  TData = InferBusterSocketResponseData<TRoute>,
  TPayload = InferBusterSocketRequestPayload<TRequestRoute>
>(
  socketRequest: BusterSocketRequestConfig<TRequestRoute>,
  socketResponse: BusterSocketResponseConfig<TRoute>,
  options?: Omit<UseMutationOptions<TData, TError, TPayload>, 'mutationFn'>
) {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();

  const mutationFn = useMemoizedFn(async (variables: TPayload): Promise<TData> => {
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

      return result as TData;
    } catch (error) {
      throw error;
    }
  });

  return useMutation<TData, TError, TPayload>({
    mutationFn,
    ...options
  });
}

const ExampleComponent = () => {
  const { mutate } = useSocketMutation<'/chats/delete', '/chats/delete:deleteChat'>(
    { route: '/chats/delete' },
    { route: '/chats/delete:deleteChat' },
    {
      onSuccess: (data) => {
        console.log(data);
      }
    }
  );

  mutate([{ id: '123' }]);
};
