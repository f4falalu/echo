import { useMetricDataIndividual } from '@/context/MetricData';
import { useBusterMetricsIndividualContextSelector } from './BusterMetricsIndividualProvider';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
import { resolveEmptyMetric, upgradeMetricToIMetric } from '../helpers';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useEffect } from 'react';

export const useBusterMetricIndividual = ({ metricId }: { metricId: string }) => {
  const onInitializeMetric = useBusterMetricsIndividualContextSelector((x) => x.onInitializeMetric);
  const getMetricMemoized = useBusterMetricsIndividualContextSelector((x) => x.getMetricMemoized);
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const setAssetPasswordError = useBusterAssetsContextSelector(
    (state) => state.setAssetPasswordError
  );

  const assetPassword = getAssetPassword(metricId);

  const {
    data: metric,
    refetch: refetchMetric,
    isFetched: isMetricFetched,
    error: metricError
  } = useSocketQueryEmitOn(
    { route: '/metrics/get', payload: { id: metricId, password: assetPassword.password } },
    '/metrics/get:updateMetricState',
    queryKeys['/metrics/get:getMetric'](metricId),
    (currentData, newData) => {
      return upgradeMetricToIMetric(newData, currentData);
    }
  );

  const metricIndividualData = useMetricDataIndividual({
    metricId
  });

  useEffect(() => {
    if (metricError) {
      setAssetPasswordError(metricId, metricError.message || 'An error occurred');
    } else {
      setAssetPasswordError(metricId, null);
    }
  }, [metricError]);

  return {
    metric: resolveEmptyMetric(metric, metricId),
    isMetricFetched,
    refetchMetric,
    ...metricIndividualData
  };
};
