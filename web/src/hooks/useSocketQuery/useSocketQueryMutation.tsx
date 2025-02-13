import {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { QueryKey, useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import {
  BusterSocketResponseConfig,
  InferBusterSocketResponseData,
  InferBusterSocketRequestPayload,
  BusterSocketRequestConfig,
  BusterSocketRequestRoute
} from './types';
import { ShareAssetType } from '@/api/asset_interfaces';
import { createQueryKey } from './helpers';

type QueryDataStrategy = 'replace' | 'append' | 'prepend' | 'merge' | 'ignore';

type SocketQueryMutationOptions<
  TRoute extends BusterSocketResponseRoute,
  TError,
  TVariables,
  TPresetResponseRoute extends BusterSocketResponseRoute = TRoute,
  TPresetRequestRoute extends BusterSocketRequestRoute = BusterSocketRequestRoute
> = Omit<
  UseMutationOptions<InferBusterSocketResponseData<TRoute>, TError, TVariables>,
  'mutationFn'
> & {
  /**
   * Function to optimistically update the mutation's own query data before the mutation completes.
   * This is useful for providing immediate UI feedback while waiting for the server response.
   *
   * @example
   * // Example: Optimistically add a new item to a list
   * preSetQueryData: (existingData, newItem) => [...existingData, newItem]
   *
   * @param data - The current data in the cache for this mutation's query key
   * @param variables - The variables passed to the mutation
   * @returns The updated data to be temporarily stored in the cache
   */
  preSetQueryData?: (
    data: InferBusterSocketResponseData<TRoute> | undefined,
    variables: TVariables
  ) => InferBusterSocketResponseData<TRoute>;

  /**
   * When true, adds a small delay before applying preSetQueryData to ensure React Query's cache
   * is properly initialized. This is useful when the mutation is called immediately after
   * component mount and you need to ensure the cache exists before updating it.
   *
   * @default false
   */
  awaitPrefetchQueryData?: boolean;

  /**
   * Determines how the mutation response data should be integrated into existing query data.
   *
   * @example
   * // Example: Append new item to a list
   * queryDataStrategy: 'append'
   *
   * @property 'replace' - Completely replace existing data with new data
   * @property 'append' - Add new data to the end of an existing array
   * @property 'prepend' - Add new data to the beginning of an existing array
   * @property 'merge' - Merge new data with existing data (useful for objects with IDs)
   * @property 'ignore' - Don't automatically update query data
   *
   * @default 'ignore'
   */
  queryDataStrategy?: QueryDataStrategy;
  /**
   * Configuration for updating query data for a different response route than the mutation's response.
   * This is useful when a mutation needs to update cached data for a different query than its own response.
   *
   * @example
   * // Example: When creating a favorite, update both the create response and the list of favorites
   * useSocketQueryMutation(
   *   { route: '/users/favorites/post' },
   *   { route: '/users/favorites/post:createFavorite' },
   *   {
   *     preSetQueryDataFunction: {
   *       responseRoute: '/users/favorites/get:listFavorites', // Different route to update
   *       requestRoute: '/users/favorites/get',
   *       callback: (existingFavorites) => [...existingFavorites, newFavorite]
   *     }
   *   }
   * )
   *
   * @property responseRoute - The route of the query data to update (different from the mutation response route)
   * @property requestRoute - Optional request route associated with the query to update
   * @property callback - Function to transform the existing data for the specified route
   *                     Takes the current data and mutation variables as arguments
   */
  preSetQueryDataFunction?: {
    responseRoute: TPresetResponseRoute;
    requestRoute?: TPresetRequestRoute;
    callback: (
      data: InferBusterSocketResponseData<TPresetResponseRoute> | undefined,
      variables: TVariables
    ) => InferBusterSocketResponseData<TPresetResponseRoute>;
  };
};

/**
 * A hook that creates a mutation for emitting socket requests and handling responses.
 *
 * @template TRoute - The type of socket response route
 * @template TData - The type of data returned by the socket response
 * @template TVariables - The type of variables passed to the mutation function
 * @template TError - The type of error that can occur
 *
 * @param socketRequest - The base socket request to emit (variables will be merged with this)
 * @param socketResponse - Configuration for the socket response including route and error handler
 * @param options - Additional options for the React Query mutation hook
 *
 * @returns A React Query mutation result for handling socket requests
 */
export const useSocketQueryMutation = <
  TRequestRoute extends BusterSocketRequestRoute,
  TRoute extends BusterSocketResponseRoute,
  TError = unknown,
  TVariables = InferBusterSocketRequestPayload<TRequestRoute>,
  TPresetResponseRoute extends BusterSocketResponseRoute = TRoute,
  TPresetRequestRoute extends BusterSocketRequestRoute = TRequestRoute
>(
  socketRequest: BusterSocketRequestConfig<TRequestRoute>,
  socketResponse: BusterSocketResponseConfig<TRoute> & {
    callback?: (data: unknown) => InferBusterSocketResponseData<TRoute>;
  },
  options?: SocketQueryMutationOptions<
    TRoute,
    TError,
    TVariables,
    TPresetResponseRoute,
    TPresetRequestRoute
  >
) => {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();
  const {
    preSetQueryData,
    queryDataStrategy = 'ignore',
    preSetQueryDataFunction,
    ...mutationOptions
  } = options || {};

  const updateQueryData = useMemoizedFn(
    async (queryKey: QueryKey, data: InferBusterSocketResponseData<TRoute>) => {
      if (queryDataStrategy === 'ignore') return;

      const strategies: Record<Exclude<QueryDataStrategy, 'ignore'>, () => Promise<void>> = {
        replace: async () => {
          await queryClient.setQueryData(queryKey, data);
        },
        append: async () => {
          await queryClient.setQueryData<InferBusterSocketResponseData<TRoute>[]>(
            queryKey,
            (prev) => [...(Array.isArray(prev) ? prev : []), data]
          );
        },
        prepend: async () => {
          await queryClient.setQueryData<InferBusterSocketResponseData<TRoute>[]>(
            queryKey,
            (prev) => [data, ...(Array.isArray(prev) ? prev : [])]
          );
        },
        merge: async () => {
          if (typeof data === 'object' && data !== null && 'id' in data) {
            await queryClient.setQueryData<Record<string, InferBusterSocketResponseData<TRoute>>>(
              queryKey,
              (prev) => ({
                ...(prev || {}),
                [(data as { id: string }).id]: data
              })
            );
          }
        }
      };

      const updateStrategy = strategies[queryDataStrategy as Exclude<QueryDataStrategy, 'ignore'>];
      if (updateStrategy) {
        await updateStrategy();
      }
    }
  );

  const mutationFn = useMemoizedFn(async (variables: TVariables) => {
    const request = {
      ...socketRequest,
      payload: variables
    } as BusterSocketRequest;

    const queryKey = createQueryKey(socketResponse, request);

    if (preSetQueryData) {
      if (options?.awaitPrefetchQueryData) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      await queryClient.setQueryData<InferBusterSocketResponseData<TRoute>>(queryKey, (prev) =>
        preSetQueryData(prev, variables)
      );
    }
    if (preSetQueryDataFunction) {
      const { responseRoute, requestRoute, callback } = preSetQueryDataFunction;

      const requestPayload: undefined | BusterSocketRequest = requestRoute
        ? ({ route: requestRoute, payload: request.payload } as BusterSocketRequest)
        : undefined;
      const presetFunctionQueryKey = createQueryKey({ route: responseRoute }, requestPayload);
      await queryClient.setQueryData<InferBusterSocketResponseData<TPresetResponseRoute>>(
        presetFunctionQueryKey,
        (prev) => {
          return callback(prev, variables);
        }
      );
    }

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
      await updateQueryData(queryKey, response as InferBusterSocketResponseData<TRoute>);
    }

    return response as InferBusterSocketResponseData<TRoute>;
  });

  return useMutation({
    ...mutationOptions,
    mutationFn
  });
};

const Example = () => {
  // Example 1: Favorites mutation
  const { mutate, mutateAsync } = useSocketQueryMutation(
    { route: '/users/favorites/post' },
    { route: '/users/favorites/post:createFavorite' },
    {
      preSetQueryDataFunction: {
        responseRoute: '/users/favorites/post:createFavorite',
        requestRoute: '/users/favorites/post',
        callback: (data) => data || []
      }
    }
  );

  mutate({
    id: 'some-asset-id',
    asset_type: ShareAssetType.DASHBOARD,
    title: 'some-title'
  });

  return null;
};
