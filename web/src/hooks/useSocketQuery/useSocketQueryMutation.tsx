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
  TVariables
> = Omit<
  UseMutationOptions<InferBusterSocketResponseData<TRoute>, TError, TVariables>,
  'mutationFn'
> & {
  preSetQueryData?: (
    data: InferBusterSocketResponseData<TRoute> | undefined,
    variables: TVariables
  ) => InferBusterSocketResponseData<TRoute>;
  awaitPrefetchQueryData?: boolean;
  queryDataStrategy?: QueryDataStrategy;
  presetQueryDataFunction?: (
    inferredReturnRoute: TRoute,
    data: InferBusterSocketResponseData<TRoute>
  ) => void;
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

    if (preSetQueryData) {
      if (options?.awaitPrefetchQueryData) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      await queryClient.setQueryData<InferBusterSocketResponseData<TRoute>>(queryKey, (prev) =>
        preSetQueryData(prev, variables)
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
    { route: '/users/favorites/post:createFavorite' }
  );

  mutate({
    id: 'some-asset-id',
    asset_type: ShareAssetType.DASHBOARD,
    title: 'some-title'
  });

  return null;
};
