import { useQuery, QueryKey, UseQueryOptions } from '@tanstack/react-query';
import type {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useBusterWebSocket } from '../useBusterWebSocket';
import { transformError } from './helpers';
import type {
  UseBusterSocketQueryOptions,
  UseBusterSocketQueryResult,
  InferBusterSocketResponseData,
  BusterSocketResponseConfig
} from './types';
import { useCreateReactQuery } from '@/api/createReactQuery';

export function useBusterWebSocketQuery<TRoute extends BusterSocketResponseRoute, TError = unknown>(
  queryKey: QueryKey,
  socketRequest: BusterSocketRequest,
  socketResponse: BusterSocketResponseConfig<TRoute>,
  options?: UseQueryOptions<InferBusterSocketResponseData<TRoute>, TError>
): UseBusterSocketQueryResult<InferBusterSocketResponseData<TRoute>, TError> {
  const busterSocket = useBusterWebSocket();

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

  // return useCreateReactQuery<InferBusterSocketResponseData<TRoute>>({
  //   queryKey,
  //   queryFn,
  //   isUseSession: false
  // });

  return useQuery<
    InferBusterSocketResponseData<TRoute>,
    TError,
    InferBusterSocketResponseData<TRoute>
  >({
    queryKey,
    queryFn,
    ...options
  });
}

// Example usage with automatic type inference
export const ExampleUsage = () => {
  const { data, isLoading, error } = useBusterWebSocketQuery(
    ['chats', 'get', '123'],
    { route: '/chats/get', payload: { id: '123' } },
    { route: '/chats/get:getChat' }
  );

  useCreateReactQuery;
};
