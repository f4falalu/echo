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

export function useBusterWebSocketQuery<TRoute extends BusterSocketResponseRoute, TError = unknown>(
  queryKey: QueryKey,
  socketRequest: BusterSocketRequest,
  socketResponse: BusterSocketResponseConfig<TRoute>,
  options?: Omit<
    UseQueryOptions<InferBusterSocketResponseData<TRoute>, TError>,
    'queryKey' | 'queryFn'
  >
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

  return useCreateReactQuery<InferBusterSocketResponseData<TRoute>, TError>({
    queryKey,
    queryFn,
    isUseSession: false,
    options
  });
}

// Example usage with automatic type inference
const ExampleUsage = () => {
  const { data, isLoading, error } = useBusterWebSocketQuery(
    ['chats', 'get', '123'],
    { route: '/chats/get', payload: { id: '123' } },
    { route: '/chats/get:getChat' }
  );
};
