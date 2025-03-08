import { queryKeys } from '@/api/query_keys';
import { useSocketQueryEmitAndOnce } from '@/api/buster_socket_query';
import type { BusterMetricData } from '@/api/asset_interfaces/metric';

export const useMetricDataIndividual = ({ metricId }: { metricId: string }) => {
  const {
    data: metricData,
    isFetched: isFetchedMetricData,
    refetch: refetchMetricData,
    dataUpdatedAt: metricDataUpdatedAt,
    error: metricDataError
  } = useSocketQueryEmitAndOnce({
    emitEvent: {
      route: '/metrics/data',
      payload: { id: metricId }
    },
    responseEvent: '/metrics/get:fetchingData',
    options: queryKeys.chatsMessagesFetchingData(metricId),
    callback: (currentData, responseData) => {
      const metricId = responseData.metric_id;
      const newMetricData: BusterMetricData = {
        ...currentData,
        metricId,
        data: responseData.data ?? currentData?.data!,
        data_metadata: responseData.data_metadata ?? currentData?.data_metadata!,
        code: responseData.code
      };
      return newMetricData;
    }
  });

  return {
    metricData,
    isFetchedMetricData,
    refetchMetricData,
    metricDataUpdatedAt,
    metricDataError
  };
};
