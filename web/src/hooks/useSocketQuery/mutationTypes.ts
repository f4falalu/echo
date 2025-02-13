import { UseMutationOptions } from '@tanstack/react-query';
import { BusterSocketResponseRoute } from '@/api/buster_socket';
import type { InferBusterSocketResponseData, BusterSocketRequestRoute } from './types';

export type QueryDataStrategy = 'replace' | 'append' | 'prepend' | 'merge' | 'ignore';

export type PreSetQueryDataItem<TVariables> = {
  [Route in BusterSocketResponseRoute]: {
    responseRoute: Route;
    requestRoute?: BusterSocketRequestRoute;
    callback: (
      data: InferBusterSocketResponseData<Route>,
      variables: TVariables
    ) => InferBusterSocketResponseData<Route>;
  };
}[BusterSocketResponseRoute];

export type SinglePreSetQueryDataItem<TRoute extends BusterSocketResponseRoute, TVariables> = {
  requestRoute?: BusterSocketRequestRoute;
  callback: (
    data: InferBusterSocketResponseData<TRoute>,
    variables: TVariables
  ) => InferBusterSocketResponseData<TRoute>;
};

export type SocketQueryMutationOptions<
  TRoute extends BusterSocketResponseRoute,
  TError,
  TVariables
> = Omit<
  UseMutationOptions<InferBusterSocketResponseData<TRoute>, TError, TVariables>,
  'mutationFn'
> & {
  /**
   * Configuration for optimistically updating query data before the mutation completes.
   * Can be either a single item or an array of items.
   */
  preSetQueryData?:
    | Array<PreSetQueryDataItem<TVariables>>
    | SinglePreSetQueryDataItem<TRoute, TVariables>;

  /**
   * When true, adds a small delay before applying preSetQueryData to ensure React Query's cache
   * is properly initialized.
   * @default false
   */
  awaitPrefetchQueryData?: boolean;

  /**
   * Strategy for integrating mutation response data into existing query data.
   * @property 'replace' - Replace existing data
   * @property 'append' - Add to end of array
   * @property 'prepend' - Add to start of array
   * @property 'merge' - Merge objects (requires ID field)
   * @property 'ignore' - No automatic update
   * @default 'ignore'
   */
  queryDataStrategy?: QueryDataStrategy;
};
