import { useParams, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemoizedFn } from '@/hooks';
import { IBusterMetric } from '@/api/asset_interfaces/metric';
import { metricsQueryKeys } from '@/api/query_keys/metric';

export const useGetMetricVersionNumber = (props?: {
  versionNumber?: number | null; //if null it will not use a params from the query params
}) => {
  const { versionNumber: versionNumberProp } = props || {};
  const { versionNumber: versionNumberPathParam, metricId: metricIdPathParam } = useParams() as {
    versionNumber: string | undefined;
    metricId: string | undefined;
  };
  const versionNumberQueryParam = useSearchParams().get('metric_version_number');
  const versionNumberFromParams = metricIdPathParam
    ? versionNumberQueryParam || versionNumberPathParam
    : undefined;

  const versionNumber = useMemo(() => {
    if (versionNumberProp === null) return undefined;
    return (
      versionNumberProp ??
      (versionNumberFromParams ? parseInt(versionNumberFromParams!) : undefined)
    );
  }, [versionNumberProp, versionNumberFromParams]);

  return versionNumber;
};

export const useGetHighestVersionMetric = () => {
  const queryClient = useQueryClient();
  const method = useMemoizedFn((metricId: string) => {
    // Get all queries related to this metric
    const metricQueries = queryClient.getQueriesData<IBusterMetric>({
      queryKey: metricsQueryKeys.metricsGetMetric(metricId, undefined).queryKey.slice(0, -1)
    });

    // Find the metric with the highest version number

    let highestVersion = -1;

    for (const [queryKey, data] of metricQueries) {
      if (!data) continue;

      const versionNumber = data.version_number;
      if (versionNumber !== undefined && versionNumber > highestVersion) {
        highestVersion = versionNumber;
      }
    }

    return highestVersion === -1 ? undefined : highestVersion;
  });

  return method;
};
