import { useQuery } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { useMemoizedFn } from '@/hooks';
import { getMetric, getMetric_server, listMetrics, listMetrics_server } from './requests';
import type { GetMetricParams, ListMetricsParams } from './interfaces';
import { upgradeMetricToIMetric } from '@/lib/chat';
import { queryKeys } from '@/api/query_keys';

export const useGetMetric = (params: GetMetricParams) => {
  const queryFn = useMemoizedFn(async () => {
    const result = await getMetric(params);
    return upgradeMetricToIMetric(result, null);
  });

  return useQuery({
    ...queryKeys.useMetricsGetMetric(params.id),
    queryFn,
    enabled: false //this is handle via a socket query? maybe it should not be?
  });
};

export const prefetchGetMetric = async (params: GetMetricParams, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.useMetricsGetMetric(params.id),
    queryFn: async () => {
      const result = await getMetric_server(params);
      return upgradeMetricToIMetric(result, null);
    }
  });

  return queryClient;
};

export const useGetMetricsList = (params: ListMetricsParams) => {
  const queryFn = useMemoizedFn(() => {
    return listMetrics(params);
  });

  const res = useQuery({
    ...queryKeys.metricsGetList(params),
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
    ...queryKeys.metricsGetList(params),
    queryFn: () => listMetrics_server(params)
  });

  return queryClient;
};
