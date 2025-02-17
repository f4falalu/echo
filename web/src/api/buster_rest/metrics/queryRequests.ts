import { useCreateReactQuery } from '@/api/createReactQuery';
import { QueryClient } from '@tanstack/react-query';
import { useMemoizedFn } from 'ahooks';
import { getMetric, getMetric_server, listMetrics, listMetrics_server } from './requests';
import type { GetMetricParams, ListMetricsParams } from './interfaces';
import { BusterMetric, BusterMetricListItem } from '@/api/asset_interfaces';
import { IBusterMetric } from '@/context/Metrics';
import { upgradeMetricToIMetric } from '@/context/Metrics/helpers';

export const useGetMetric = (params: GetMetricParams) => {
  const queryFn = useMemoizedFn(async () => {
    const result = await getMetric(params);
    return upgradeMetricToIMetric(result, null);
  });

  return useCreateReactQuery<IBusterMetric>({
    queryKey: ['metric', params],
    queryFn,
    enabled: false //this is handle via a socket query? maybe it should not be?
  });
};

export const prefetchGetMetric = async (params: GetMetricParams, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['metric', params],
    queryFn: () => getMetric_server(params)
  });

  return queryClient;
};

export const useGetMetricsList = (params: ListMetricsParams) => {
  const queryFn = useMemoizedFn(() => {
    return listMetrics(params);
  });

  const res = useCreateReactQuery<BusterMetricListItem[]>({
    queryKey: ['metrics', 'list', params],
    queryFn
  });

  return {
    ...res,
    data: res.data || []
  };
};

export const prefetchGetMetricsList = async (
  params: ListMetricsParams,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['metrics', 'list', params],
    queryFn: () => listMetrics_server(params)
  });

  return queryClient;
};
