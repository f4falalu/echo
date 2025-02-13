'use client';

import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult
} from '@tanstack/react-query';
import type {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useEffect } from 'react';
import {
  BusterSocketResponseConfig,
  BusterSocketResponseConfigRoute,
  InferBusterSocketResponseData
} from './types';
import { useMount } from 'ahooks';
import { queryOptionsConfig } from './queryKeyConfig';
import { BusterChat } from '@/api/asset_interfaces';

export const useSocketQueryOn = <
  TRoute extends BusterSocketResponseRoute,
  TError = unknown,
  TData = InferBusterSocketResponseData<TRoute>,
  TQueryKey extends QueryKey = QueryKey
>(
  socketResponse: TRoute,
  options: UseQueryOptions<TData, TError, TData, TQueryKey>,
  callback?: (d: InferBusterSocketResponseData<TRoute>) => TData
): UseQueryResult<TData, TError> => {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();
  const queryKey = options.queryKey;

  useMount(() => {
    busterSocket.on({
      route: socketResponse,
      callback: (d: unknown) => {
        const socketData = d as InferBusterSocketResponseData<TRoute>;
        const transformer = callback || ((d: InferBusterSocketResponseData<TRoute>) => d as TData);
        const transformedData = transformer(socketData);
        queryClient.setQueryData<TData>(queryKey, transformedData);
      }
    } as BusterSocketResponse);
  });

  return useQuery({
    ...options,
    enabled: false
  });
};

const ExampleComponent = () => {
  const options = queryOptionsConfig['/chats/get:getChat']('123');
  const { data } = useSocketQueryOn('/chats/get:getChat', options);

  const options2 = queryOptionsConfig['/chats/list:getChatsList']();
  const { data: data2 } = useSocketQueryOn('/chats/list:getChatsList', options2);

  const options3 = queryOptionsConfig['/chats/delete:deleteChat']('123');

  const { data: data3 } = useSocketQueryOn('/chats/delete:deleteChat', options3, (d) => {
    return deleteChatInitialData;
  });
};

// Create fresh options for delete chat that match the expected BusterChat type
const deleteChatInitialData: BusterChat = {
  id: '123',
  title: '',
  is_favorited: false,
  messages: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: '',
  created_by_id: '',
  created_by_name: '',
  created_by_avatar: null
};
