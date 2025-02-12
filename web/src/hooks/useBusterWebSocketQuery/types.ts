import { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import {
  BusterSocketRequestBase,
  BusterSocketResponseBase
} from '@/api/buster_socket/base_interfaces';

export interface UseBusterSocketQueryOptions<TData, TError = unknown>
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  socketRequest: BusterSocketRequestBase;
  socketResponse: Omit<BusterSocketResponseBase, 'callback' | 'onError'>;
}

export type UseBusterSocketQueryResult<TData, TError = unknown> = UseQueryResult<TData, TError>;
