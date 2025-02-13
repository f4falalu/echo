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
import type { BusterChatListItem } from '@/api/asset_interfaces/chat';

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
  preCallback?: (currentData: TQueryData | null, variables: TPayload) => TQueryData,
  callback?: (
    currentData: TQueryData | null,
    newData: InferBusterSocketResponseData<TRoute>
  ) => TQueryData
) {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();

  const mutationFn = useMemoizedFn(async (variables: TPayload): Promise<TData> => {
    const queryKey = options?.queryKey;

    if (queryKey && preCallback) {
      const currentData = queryClient.getQueryData<TQueryData>(queryKey) ?? null;
      const transformedData = preCallback(currentData, variables);
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
        const transformedData = callback(currentData, socketData);
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

const ExampleComponent = () => {
  const queryClient = useQueryClient();
  const options = queryOptionsConfig['/chats/list:getChatsList']();
  const data = queryClient.getQueryData(options.queryKey);
  data?.[0].created_by_avatar;

  const { mutate } = useSocketQueryMutation<
    '/chats/delete',
    '/chats/delete:deleteChat',
    unknown,
    { id: string }[],
    { id: string }[],
    BusterChatListItem[]
  >(
    { route: '/chats/delete' },
    { route: '/chats/delete:deleteChat' },
    options,
    (currentData, newData) => {
      currentData?.[0].created_by_avatar; // This should now be properly typed
      return currentData ?? [];
    }
  );

  mutate([{ id: '123' }]);
};
