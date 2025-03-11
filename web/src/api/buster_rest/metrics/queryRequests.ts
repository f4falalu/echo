import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { useMemoizedFn } from '@/hooks';
import {
  deleteMetrics,
  getMetric,
  getMetric_server,
  getMetricData,
  listMetrics,
  listMetrics_server,
  updateMetric
} from './requests';
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

export const useGetMetricData = (params: { id: string }) => {
  const queryFn = useMemoizedFn(() => {
    return getMetricData(params);
  });
  return useQuery({
    ...queryKeys.metricsGetData(params.id),
    queryFn,
    enabled: !!params.id
  });
};

export const useUpdateMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMetric,
    onSuccess: (data, variables, context) => {
      const hasDraftSessionId = data.draft_session_id;
      const metricId = data.id;
      const options = queryKeys.metricsGetMetric(metricId);
      const currentMetric = queryClient.getQueryData(options.queryKey);
      if (hasDraftSessionId && !currentMetric?.draft_session_id && currentMetric) {
        queryClient.setQueryData(options.queryKey, {
          ...currentMetric,
          draft_session_id: data.draft_session_id
        });
      }
    }
  });
};

export const useDeleteMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMetrics,
    onMutate: async (variables) => {
      const metricIds = variables.ids;
      const options = queryKeys.metricsGetList();
      queryClient.setQueryData(options.queryKey, (oldData) => {
        return oldData?.filter((metric) => !metricIds.includes(metric.id));
      });
      for (const metricId of metricIds) {
        queryClient.removeQueries({
          queryKey: queryKeys.metricsGetMetric(metricId).queryKey,
          exact: true
        });
      }
    }
  });
};
