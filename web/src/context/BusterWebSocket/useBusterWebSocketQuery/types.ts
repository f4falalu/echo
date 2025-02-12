import type { BusterSocketResponse, BusterSocketResponseRoute } from '@/api/buster_socket';
import { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/**
 * Infers the response data type from a BusterSocket route
 */
export type InferBusterSocketResponseData<TRoute extends BusterSocketResponseRoute> = Extract<
  BusterSocketResponse,
  { route: TRoute }
>['callback'] extends (d: infer D) => void
  ? D
  : never;

/**
 * Socket response configuration with optional error handler
 */
export type BusterSocketResponseConfig<TRoute extends BusterSocketResponseRoute> = {
  route: TRoute;
  onError?: (d: unknown) => void;
};

export interface UseBusterSocketQueryOptions<TData, TError = unknown>
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {}

export type UseBusterSocketQueryResult<TData, TError = unknown> = UseQueryResult<TData, TError>;
