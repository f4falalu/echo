import { BusterSocketRequest, BusterSocketResponseRoute } from '@/api/buster_socket';
import { BusterSocketResponseConfig, InferBusterSocketResponseData } from './types';
import { QueryKey } from '@tanstack/react-query';

export const createQueryKey: <TRoute extends BusterSocketResponseRoute>(
  socketResponse: BusterSocketResponseConfig<TRoute>['route'],
  callbackResult: InferBusterSocketResponseData<TRoute>,
  socketRequest?: BusterSocketRequest
) => QueryKey = (socketResponse, callbackResult, socketRequest) => {
  if (socketRequest) return [socketResponse, socketRequest.route, socketRequest.payload];
  return [socketResponse];
};
