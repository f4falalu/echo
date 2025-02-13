'use client';

import {
  type QueryKey,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query';
import type { BusterSocketResponse, BusterSocketResponseRoute } from '@/api/buster_socket';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemo, useRef, useTransition } from 'react';
import type { InferBusterSocketResponseData } from './types';
import { useMemoizedFn, useMount, useUnmount } from 'ahooks';
import { queryOptionsConfig } from './queryKeyConfig';
import { BusterChat } from '@/api/asset_interfaces';

type UseSocketQueryOnResult<TData, TError> = UseQueryResult<TData, TError>;

export const useSocketQueryOn = <
  TRoute extends BusterSocketResponseRoute,
  TError = unknown,
  TData = InferBusterSocketResponseData<TRoute>,
  TQueryKey extends QueryKey = QueryKey
>(
  socketResponse: TRoute,
  options: UseQueryOptions<TData, TError, TData, TQueryKey>,
  callback?: (currentData: TData | null, newData: InferBusterSocketResponseData<TRoute>) => TData
): UseSocketQueryOnResult<TData, TError> => {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();
  const queryKey = options.queryKey;
  const bufferRef = useRef<TData | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasBufferCallback = !!callback;

  const socketCallback = useMemoizedFn((d: unknown) => {
    const socketData = d as InferBusterSocketResponseData<TRoute>;

    const transformer = callback || defaultCallback<TData, TRoute>;
    const transformedData = transformer(bufferRef.current, socketData);

    if (hasBufferCallback) {
      bufferRef.current = transformedData;
      startTransition(() => {
        queryClient.setQueryData<TData>(queryKey, transformedData);
      });
    } else {
      queryClient.setQueryData<TData>(queryKey, transformedData);
    }
  });

  const socketConfig = useMemo(() => {
    return {
      route: socketResponse,
      callback: socketCallback
    } as BusterSocketResponse;
  }, [socketResponse, socketCallback]);

  useMount(() => {
    busterSocket.on(socketConfig);
  });

  useUnmount(() => {
    busterSocket.off(socketConfig);
  });

  return useQuery({
    ...options,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: false // must be disabled, because it will be enabled by the socket
  });
};

const defaultCallback = <TData, TRoute extends BusterSocketResponseRoute>(
  currentData: TData | null,
  d: InferBusterSocketResponseData<TRoute>
) => d as TData;

const _ExampleComponent = () => {
  const options = queryOptionsConfig['/chats/get:getChat']('123');
  const { data } = useSocketQueryOn('/chats/get:getChat', options);

  const options2 = queryOptionsConfig['/chats/list:getChatsList']();
  const { data: data2 } = useSocketQueryOn('/chats/list:getChatsList', options2);

  const options3 = queryOptionsConfig['/chats/delete:deleteChat']('123');

  // Create fresh options for delete chat that match the expected BusterChat type
  const deleteChatInitialData = {
    id: '123'
  } as unknown as BusterChat;

  const { data: data3 } = useSocketQueryOn('/chats/delete:deleteChat', options3, (d, x) => {
    d?.id;
    x[0].id;
    return deleteChatInitialData;
  });
};
