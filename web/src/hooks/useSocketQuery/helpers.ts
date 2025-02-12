import { BusterSocketRequest, BusterSocketResponseRoute } from '@/api/buster_socket';
import { BusterSocketResponseConfig } from './types';
import { QueryKey } from '@tanstack/react-query';

export const createQueryKey: <TRoute extends BusterSocketResponseRoute>(
  socketResponse: BusterSocketResponseConfig<TRoute>,
  socketRequest?: BusterSocketRequest
) => QueryKey = (socketResponse, socketRequest) => {
  if (socketRequest) return [socketResponse.route, socketRequest.route, socketRequest.payload];
  return [socketResponse.route];
};
