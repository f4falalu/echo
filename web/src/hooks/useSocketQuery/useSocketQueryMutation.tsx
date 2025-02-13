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
import { ShareAssetType, BusterUserFavorite } from '@/api/asset_interfaces';
import { createQueryKey } from './helpers';

type QueryDataStrategy = 'replace' | 'append' | 'prepend' | 'merge' | 'ignore';

type PreSetQueryDataItem<PRoute extends BusterSocketResponseRoute, TVariables> = {
  responseRoute: BusterSocketResponseConfig<PRoute>['route'];
  requestRoute?: BusterSocketRequestRoute;
  callback: (data: InferBusterSocketResponseData<PRoute>, variables: TVariables) => unknown;
};

type SocketQueryMutationOptions<
  TRoute extends BusterSocketResponseRoute,
  TError,
  TVariables
> = Omit<
  UseMutationOptions<InferBusterSocketResponseData<TRoute>, TError, TVariables>,
  'mutationFn'
> & {
  /**
   * Array of configurations for optimistically updating query data before the mutation completes.
   * Each item in the array specifies a different route's data to update.
   * The callback for each item will automatically infer the correct data type based on the route.
   *
   * @example
   * // Example: When creating a favorite, update multiple related queries
   * useSocketQueryMutation(
   *   { route: '/users/favorites/post' },
   *   { route: '/users/favorites/post:createFavorite' },
   *   {
   *     preSetQueryData: [
   *       {
   *         responseRoute: '/users/favorites/list:listFavorites',
   *         callback: (existingFavorites, variables) => [...(existingFavorites || []), variables]
   *       },
   *       {
   *         responseRoute: '/users/favorites/post:createFavorite',
   *         callback: (_, variables) => [variables]
   *       }
   *     ]
   *   }
   * )
   */
  preSetQueryData?:
    | Array<PreSetQueryDataItem<TRoute, TVariables>>
    | PreSetQueryDataItem<TRoute, TVariables>;

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
    const arrayOfPreSetQueryData = Array.isArray(preSetQueryData)
      ? preSetQueryData
      : [preSetQueryData];

    if (preSetQueryData && arrayOfPreSetQueryData.filter(Boolean).length > 0) {
      if (options?.awaitPrefetchQueryData) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      for (const item of arrayOfPreSetQueryData) {
        const { responseRoute, requestRoute, callback } = item!;
        const requestPayload: undefined | BusterSocketRequest = requestRoute
          ? ({ route: requestRoute, payload: request.payload } as BusterSocketRequest)
          : undefined;
        const presetQueryKey = createQueryKey({ route: responseRoute }, requestPayload);
        await queryClient.setQueryData(presetQueryKey, (prev: any) => {
          return callback(prev, variables);
        });
      }
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
  // Example: Favorites mutation with multiple preSetQueryData updates
  const { mutate } = useSocketQueryMutation(
    { route: '/users/favorites/post' },
    { route: '/users/favorites/post:createFavorite' },
    {
      preSetQueryData: [
        {
          responseRoute: '/users/favorites/list:listFavorites',
          callback: (data, variables) => {
            const favorites = Array.isArray(data) ? data : [];
            return [variables, ...favorites];
          }
        },
        {
          responseRoute: '/users/favorites/post:createFavorite',
          callback: (_: unknown, variables: BusterUserFavorite) => {
            return [variables];
          }
        }
      ]
    }
  );

  mutate({
    id: 'some-asset-id',
    asset_type: ShareAssetType.DASHBOARD,
    name: 'some-title'
  });

  const { mutate: mutate2 } = useSocketQueryMutation(
    { route: '/dashboards/delete' },
    { route: '/dashboards/delete:deleteDashboard' },
    {
      preSetQueryData: [
        {
          responseRoute: '/chats/list:getChatsList',
          callback: (data, variables) => {
            return [variables, ...(data || [])];
          }
        }
      ]
    }
  );

  return null;
};
