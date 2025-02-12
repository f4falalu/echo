import {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
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
    callback?: (d: unknown) => InferBusterSocketResponseData<TRoute>;
  },
  optionsProps?: Omit<
    UseMutationOptions<InferBusterSocketResponseData<TRoute>, TError, TVariables>,
    'mutationFn'
  > & {
    preSetQueryData?: (
      d: InferBusterSocketResponseData<TRoute> | undefined,
      variables: TVariables
    ) => InferBusterSocketResponseData<TRoute>;
    queryDataStrategy?: 'replace' | 'append' | 'prepend' | 'merge' | 'ignore';
  }
) => {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();
  const { preSetQueryData, queryDataStrategy = 'ignore', ...options } = optionsProps || {};

  const mutationFn = useMemoizedFn(async (variables: TVariables) => {
    const compiledSocketRequest = {
      ...socketRequest,
      payload: variables
    } as unknown as BusterSocketRequest;
    const queryKey = createQueryKey(socketResponse, compiledSocketRequest);

    if (preSetQueryData) {
      await queryClient.setQueryData<InferBusterSocketResponseData<TRoute>>(queryKey, (d) => {
        return preSetQueryData(d, variables);
      });
    }

    const res = await busterSocket.emitAndOnce({
      emitEvent: compiledSocketRequest,
      responseEvent: {
        ...socketResponse,
        callback: (d: unknown) => {
          if (socketResponse.callback) {
            socketResponse.callback(d);
          }
          return d;
        }
      } as BusterSocketResponse
    });

    if (res !== undefined) {
      if (queryDataStrategy === 'replace') {
        await queryClient.setQueryData<InferBusterSocketResponseData<TRoute>>(queryKey, () => {
          return res as InferBusterSocketResponseData<TRoute>;
        });
      } else if (queryDataStrategy === 'append') {
        await queryClient.setQueryData<InferBusterSocketResponseData<TRoute>[]>(queryKey, (d) => {
          return [...(Array.isArray(d) ? d : []), res as InferBusterSocketResponseData<TRoute>];
        });
      } else if (queryDataStrategy === 'prepend') {
        await queryClient.setQueryData<InferBusterSocketResponseData<TRoute>[]>(queryKey, (d) => {
          return [res as InferBusterSocketResponseData<TRoute>, ...(Array.isArray(d) ? d : [])];
        });
      } else if (queryDataStrategy === 'merge') {
        await queryClient.setQueryData<Record<string, InferBusterSocketResponseData<TRoute>>>(
          queryKey,
          (d) => {
            if (typeof res === 'object' && res !== null && 'id' in res) {
              const typedRes = res as InferBusterSocketResponseData<TRoute> & { id: string };
              return {
                ...(d || {}),
                [typedRes.id]: typedRes
              };
            } else {
              console.warn('response is not an object with an id', res);
            }
            return d;
          }
        );
      }
    }

    return res as InferBusterSocketResponseData<TRoute>;
  });

  return useMutation({
    ...options,
    mutationFn: mutationFn
  });
};

const Example = () => {
  // Example 1: Favorites mutation
  const { mutate, data } = useSocketQueryMutation(
    {
      route: '/users/favorites/post'
    },
    {
      route: '/users/favorites/post:createFavorite'
    }
  );

  mutate({
    id: 'some-asset-id',
    asset_type: ShareAssetType.DASHBOARD
  });

  return null;
};
