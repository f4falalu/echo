import { useMetricDataIndividual } from '@/context/MetricData';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
import { resolveEmptyMetric, upgradeMetricToIMetric } from '../helpers';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';

export const useMetricIndividual = ({ metricId }: { metricId: string }) => {
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const assetPassword = getAssetPassword(metricId);

  const {
    data: metric,
    refetch: refetchMetric,
    isFetched: isMetricFetched,
    error: metricError
  } = useSocketQueryEmitOn({
    emitEvent: {
      route: '/metrics/get',
      payload: { id: metricId, password: assetPassword.password }
    },
    responseEvent: '/metrics/get:updateMetricState',
    options: queryKeys.useMetricsGetMetric(metricId),
    callback: (currentData, newData) => {
      return upgradeMetricToIMetric(newData, currentData);
    }
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
