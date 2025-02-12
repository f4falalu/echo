import { BusterSocketRequest, BusterSocketResponse } from '@/api/buster_socket';
import { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

export type QueryKey = readonly unknown[];

export interface UseBusterSocketQueryOptions<TData, TError = unknown>
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {}

export type UseBusterSocketQueryResult<TData, TError = unknown> = UseQueryResult<TData, TError>;
