import {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import {
  BusterSocketResponseConfig,
  InferBusterSocketResponseData,
  InferBusterSocketRequestPayload,
  BusterSocketRequestConfig,
  BusterSocketRequestRoute
} from './types';
import { SocketQueryMutationOptions } from './mutationTypes';
import { executeQueryDataStrategy } from './queryDataStrategies';
import { createQueryKey } from './helpers';

/**
 * A hook that creates a mutation for emitting socket requests and handling responses.
 * Supports optimistic updates and various strategies for updating the query cache.
 *
 * @template TRequestRoute - The socket request route type
 * @template TRoute - The socket response route type
 * @template TError - The error type that can occur
 * @template TVariables - The variables type passed to the mutation function
 *
 * @param socketRequest - The base socket request configuration
 * @param socketResponse - The socket response configuration with optional error handler
 * @param options - Additional options for configuring the mutation behavior
 *
 * @example
 * ```tsx
 * const { mutate } = useSocketQueryMutation(
 *   { route: '/users/favorites/post' },
 *   { route: '/users/favorites/post:createFavorite' },
 *   {
 *     preSetQueryData: [
 *       {
 *         responseRoute: '/users/favorites/list:listFavorites',
 *         callback: (data, variables) => [...(data || []), variables]
 *       }
 *     ],
 *     queryDataStrategy: 'append'
 *   }
 * );
 * ```
 */
export const useSocketQueryMutation = <
  TRequestRoute extends BusterSocketRequestRoute,
  TRoute extends BusterSocketResponseRoute,
  TError = unknown,
  TVariables = InferBusterSocketRequestPayload<TRequestRoute>
>(
  socketRequest: BusterSocketRequestConfig<TRequestRoute>,
  socketResponse: BusterSocketResponseConfig<TRoute> & {
    callback?: (data: unknown) => InferBusterSocketResponseData<TRoute>;
  },
  options?: SocketQueryMutationOptions<TRoute, TError, TVariables>
) => {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();
  const { preSetQueryData, queryDataStrategy = 'ignore', ...mutationOptions } = options || {};

  const handlePreSetQueryData = useMemoizedFn(async (variables: TVariables) => {
    if (!preSetQueryData) return;

    if (options?.awaitPrefetchQueryData) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    const arrayOfPreSetQueryData = Array.isArray(preSetQueryData)
      ? preSetQueryData
      : [{ ...preSetQueryData, responseRoute: socketResponse.route }];

    for (const item of arrayOfPreSetQueryData) {
      const { responseRoute, requestRoute, callback } = item!;
      const requestPayload: undefined | BusterSocketRequest = requestRoute
        ? ({ route: requestRoute, payload: variables } as BusterSocketRequest)
        : undefined;
      const presetQueryKey = createQueryKey({ route: responseRoute! }, requestPayload);
      await queryClient.setQueryData(presetQueryKey, (prev: any) => callback(prev, variables));
    }
  });

  const mutationFn = useMemoizedFn(async (variables: TVariables) => {
    const request = {
      ...socketRequest,
      payload: variables
    } as BusterSocketRequest;

    const queryKey = createQueryKey(socketResponse, request);
    await handlePreSetQueryData(variables);

    const response = await busterSocket.emitAndOnce({
      emitEvent: request,
      responseEvent: {
        ...socketResponse,
        callback: (data: unknown) => {
          socketResponse.callback?.(data);
          return data;
        }
      } as BusterSocketResponse
    });

    if (response !== undefined) {
      await executeQueryDataStrategy(
        queryClient,
        queryKey as unknown[],
        response as InferBusterSocketResponseData<TRoute>,
        queryDataStrategy
      );
    }

    return response as InferBusterSocketResponseData<TRoute>;
  });

  return useMutation({
    ...mutationOptions,
    mutationFn
  });
};
