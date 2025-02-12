import { useQuery, QueryKey } from '@tanstack/react-query';
import {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useBusterWebSocket } from '../useBusterWebSocket';
import { transformError } from './helpers';
import { UseBusterSocketQueryOptions, UseBusterSocketQueryResult } from './types';

export function useBusterWebSocketQuery<TRoute extends BusterSocketResponseRoute, TError = unknown>(
  queryKey: QueryKey,
  socketRequest: BusterSocketRequest,
  socketResponse: { route: TRoute; onError?: (d: unknown) => void },
  options: UseBusterSocketQueryOptions<
    Extract<BusterSocketResponse, { route: TRoute }>['callback'] extends (d: infer D) => void
      ? D
      : never,
    TError
  > = {}
): UseBusterSocketQueryResult<
  Extract<BusterSocketResponse, { route: TRoute }>['callback'] extends (d: infer D) => void
    ? D
    : never,
  TError
> {
  const busterSocket = useBusterWebSocket();

  const queryFn = async () => {
    try {
      const result = await busterSocket.emitAndOnce({
        emitEvent: socketRequest,
        responseEvent: {
          route: socketResponse.route,
          onError: socketResponse.onError,
          callback: (d: unknown) => d
        } as BusterSocketResponse
      });

      return result as Extract<BusterSocketResponse, { route: TRoute }>['callback'] extends (
        d: infer D
      ) => void
        ? D
        : never;
    } catch (error) {
      throw transformError(error);
    }
  };

  return useQuery({
    queryKey,
    queryFn
  });
}

// Example usage with automatic type inference
export const ExampleUsage = () => {
  const { data, isLoading, error } = useBusterWebSocketQuery(
    ['chats', 'get', '123'],
    { route: '/chats/get', payload: { id: '123' } },
    { route: '/chats/get:getChat' }
  );
};
