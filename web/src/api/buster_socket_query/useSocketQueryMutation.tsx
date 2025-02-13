'use client';

import {
  MutationFunction,
  QueryKey,
  type UseQueryOptions,
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
import type {
  BusterSocketRequestConfig,
  BusterSocketRequestRoute,
  BusterSocketResponseConfig,
  InferBusterSocketRequestPayload,
  InferBusterSocketResponseData
} from './types';

/**
 * A custom hook that combines WebSocket communication with React Query's mutation capabilities.
 * This hook allows you to emit socket events and handle their responses while integrating with React Query's state management.
 *
 * @template TRequestRoute - The type of socket request route
 * @template TRoute - The type of socket response route
 * @template TError - The type of error that might occur during the mutation
 * @template TData - The type of data returned by the socket response
 * @template TPayload - The type of payload sent in the socket request
 * @template TQueryData - The type of data stored in the React Query cache
 *
 * @param socketRequest - Configuration object for the socket request
 * @param socketResponse - Configuration object for handling the socket response
 * @param options - React Query options for the mutation
 * @param preCallback - Optional callback function executed before the socket request, allowing manipulation of cached data
 * @param callback - Optional callback function executed after receiving the socket response, allowing transformation of the response data
 *
 * @returns A mutation object from React Query that can be used to trigger the socket request
 *
 * @example
 * ```tsx
 * // Example usage in a component
 * function ChatComponent() {
 *   const mutation = useSocketQueryMutation(
 *     { route: 'chat:send' },
 *     { route: 'chat:message' },
 *     {
 *       queryKey: ['chat', 'messages']
 *     },
 *     // Pre-callback: Optimistically update the UI
 *     (currentMessages, newMessage) => {
 *       return [...currentMessages, { pending: true, ...newMessage }];
 *     },
 *     // Post-callback: Update with the actual response
 *     (socketResponse, currentMessages) => {
 *       return currentMessages.map(msg =>
 *         msg.pending ? socketResponse : msg
 *       );
 *     }
 *   );
 *
 *   const sendMessage = (message: string) => {
 *     mutation.mutate({ content: message });
 *   };
 *
 *   return (
 *     <button
 *       onClick={() => sendMessage('Hello!')}
 *       disabled={mutation.isPending}
 *     >
 *       Send Message
 *     </button>
 *   );
 * }
 * ```
 */
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
  options?: UseQueryOptions<TQueryData, any, TQueryData, any> | null,
  preCallback?:
    | ((currentData: TQueryData | null, variables: TPayload) => TQueryData | Promise<TQueryData>)
    | null,
  callback?:
    | ((
        newData: InferBusterSocketResponseData<TRoute>,
        currentData: TQueryData | null
      ) => TQueryData)
    | null
) {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();

  const mutationFn: MutationFunction<TData, TPayload> = useMemoizedFn(
    async (variables: TPayload): Promise<TData> => {
      const queryKey: QueryKey = options?.queryKey;

      if (preCallback) {
        const currentData = queryKey
          ? (queryClient.getQueryData<TQueryData>(queryKey) ?? null)
          : null;
        const transformedData = await preCallback(currentData, variables);
        if (queryKey) queryClient.setQueryData(queryKey, transformedData);
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

        if (callback) {
          const socketData = result as InferBusterSocketResponseData<TRoute>;
          const currentData = queryKey
            ? (queryClient.getQueryData<TQueryData>(queryKey) ?? null)
            : null;
          const transformedData = callback(socketData, currentData);
          if (queryKey) queryClient.setQueryData(queryKey, transformedData);
          return result as TData;
        }

        return result as TData;
      } catch (error) {
        throw error;
      }
    }
  );

  return useMutation<TData, TError, TPayload>({
    mutationFn
  });
}
