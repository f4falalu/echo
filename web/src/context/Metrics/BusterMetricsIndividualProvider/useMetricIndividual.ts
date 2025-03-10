import { useMetricDataIndividual } from '@/context/MetricData';
import { resolveEmptyMetric } from '../helpers';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useGetMetric } from '@/api/buster_rest/metrics';

export const useMetricIndividual = ({ metricId }: { metricId: string }) => {
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const assetPassword = getAssetPassword(metricId);

  const {
    data: metric,
    isFetched: isMetricFetched,
    error: metricError,
    refetch: refetchMetric
  } = useGetMetric({
    id: metricId,
    password: assetPassword.password
  });

  const metricIndividualData = useMetricDataIndividual({
    metricId
  });

  return {
    metric: resolveEmptyMetric(metric, metricId),
    isMetricFetched,
    refetchMetric,
    metricError,
    ...metricIndividualData
  };
};
