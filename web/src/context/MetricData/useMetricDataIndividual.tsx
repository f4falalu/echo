import { queryKeys } from '@/api/asset_interfaces';
import { useSocketQueryEmitAndOnce } from '@/api/buster_socket_query';
import { BusterMetricData } from './interfaces';

export const useMetricDataIndividual = ({ metricId }: { metricId: string }) => {
  const {
    data: metricData,
    isFetched: isFetchedMetricData,
    refetch: refetchMetricData,
    dataUpdatedAt: metricDataUpdatedAt,
    error: metricDataError
  } = useSocketQueryEmitAndOnce(
    { route: '/metrics/data', payload: { id: metricId } },
    '/metrics/get:fetchingData',
    queryKeys['/metrics/get:fetchingData'](metricId),
    (currentData, responseData) => {
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
  );

  return {
    metricData,
    isFetchedMetricData,
    refetchMetricData,
    metricDataUpdatedAt,
    metricDataError
  };
};
