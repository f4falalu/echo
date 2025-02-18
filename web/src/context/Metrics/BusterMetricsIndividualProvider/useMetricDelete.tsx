import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
import { useQueryClient } from '@tanstack/react-query';

export const useMetricDelete = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteMetric } = useSocketQueryMutation({
    emitEvent: '/metrics/delete',
    responseEvent: '/metrics/delete:deleteMetricState',
    callback: (newData, currentData, variables) => {
      const queryOptions = queryKeys.metricsGetList();
      queryClient.setQueryData(queryOptions.queryKey, (oldData) => {
        return oldData?.filter((metric) => metric.id !== variables.ids[0]) || [];
      });
      return currentData;
    }
  });

  return { deleteMetric };
};
