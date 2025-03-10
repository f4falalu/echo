import { useGetMetricData } from '@/api/buster_rest/metrics';

export const useMetricDataIndividual = ({ metricId }: { metricId: string }) => {
  const {
    data: metricData,
    isFetched: isFetchedMetricData,
    refetch: refetchMetricData,
    dataUpdatedAt: metricDataUpdatedAt,
    error: metricDataError
  } = useGetMetricData({ id: metricId });

  return {
    metricData,
    isFetchedMetricData,
    refetchMetricData,
    metricDataUpdatedAt,
    metricDataError
  };
};
