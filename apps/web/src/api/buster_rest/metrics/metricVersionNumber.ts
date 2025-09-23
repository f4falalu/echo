import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import type { BusterMetric } from '../../asset_interfaces/metric';
import { metricsQueryKeys } from '../../query_keys/metric';

const stableVersionDataSelector = (data: BusterMetric) => data.version_number;
const stableVersionSearchSelector = (state: { metric_version_number?: number | undefined }) =>
  state.metric_version_number;

export const useGetMetricVersionNumber = (
  metricId: string,
  versionNumber: number | 'LATEST' = 'LATEST'
) => {
  const { data: latestVersionNumber } = useQuery({
    ...metricsQueryKeys.metricsGetMetric(metricId, 'LATEST'),
    enabled: false,
    select: stableVersionDataSelector,
  });

  // Get the metric_version_number query param from the route
  const paramVersionNumber = useSearch({
    select: stableVersionSearchSelector,
    strict: false,
  });

  const isLatest = versionNumber === 'LATEST' || latestVersionNumber === versionNumber;

  const selectedVersionNumber = isLatest
    ? ('LATEST' as const)
    : (versionNumber ?? paramVersionNumber ?? 'LATEST');

  return useMemo(
    () => ({
      paramVersionNumber,
      latestVersionNumber,
      selectedVersionNumber,
    }),
    [paramVersionNumber, latestVersionNumber, selectedVersionNumber]
  );
};

export const useGetLatestMetricVersionMemoized = () => {
  const queryClient = useQueryClient();

  return useCallback((metricId: string) => {
    const data = queryClient.getQueryData(
      metricsQueryKeys.metricsGetMetric(metricId, 'LATEST').queryKey
    );
    return data?.version_number;
  }, []);
};
