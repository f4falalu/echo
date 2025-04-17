import { useParams, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Query, useQueryClient } from '@tanstack/react-query';
import { IBusterMetric } from '@/api/asset_interfaces/metric';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import last from 'lodash/last';
import { INFINITY } from 'chart.js/helpers';
import { useMemoizedFn } from '@/hooks';
import { RustApiError } from '../errors';

export const useGetMetricVersionNumber = (props?: { versionNumber?: number | null }) => {
  const { versionNumber: versionNumberProp } = props || {};
  const { metricId: metricIdPathParam } = useParams() as {
    metricId: string | undefined;
  };
  const versionNumberQueryParam = useSearchParams().get('metric_version_number');
  const versionNumberFromParams = metricIdPathParam ? versionNumberQueryParam : undefined;

  const paramVersionNumber = useMemo(() => {
    return (
      versionNumberProp ??
      (versionNumberFromParams ? parseInt(versionNumberFromParams!) : undefined)
    );
  }, [versionNumberProp, versionNumberFromParams]);

  const latestVersionNumber = useGetLatestMetricVersion({ metricId: metricIdPathParam! });

  const selectedVersionNumber: number | null = useMemo(() => {
    if (versionNumberProp === null) return null;
    return paramVersionNumber || latestVersionNumber || 0;
  }, [paramVersionNumber, latestVersionNumber]);

  return useMemo(() => {
    return { selectedVersionNumber, paramVersionNumber, latestVersionNumber };
  }, [selectedVersionNumber, selectedVersionNumber, latestVersionNumber]);
};

type PredicateType = (query: Query<IBusterMetric, RustApiError>) => boolean;
const filterMetricPredicate = <PredicateType>((query) => {
  const lastKey = last(query.queryKey);
  return (
    typeof lastKey === 'number' &&
    !!lastKey &&
    query.state.data !== undefined &&
    typeof query.state.data === 'object' &&
    query.state.data !== null &&
    'versions' in query.state.data
  );
});

const useGetLatestMetricVersion = ({ metricId }: { metricId: string }) => {
  const queryClient = useQueryClient();

  const memoizedKey = useMemo(() => {
    return metricsQueryKeys.metricsGetMetric(metricId, null).queryKey.slice(0, -1);
  }, [metricId]);

  const queries = queryClient.getQueriesData<IBusterMetric, any>({
    queryKey: memoizedKey,
    predicate: filterMetricPredicate
  });

  const latestVersion = useMemo(() => {
    let maxVersion = -Infinity;

    // Single pass: filter and find max version
    for (const [queryKey, data] of queries) {
      if (data && typeof data === 'object' && 'versions' in data) {
        const lastVersion = last(data.versions);
        const version = Number(lastVersion?.version_number);
        maxVersion = Math.max(maxVersion, version, data.version_number);
      }
    }

    return maxVersion === -Infinity ? null : maxVersion;
  }, [queries.length]);

  return latestVersion;
};

//This is a helper function that returns the latest version number for a metric
export const useGetLatestMetricVersionNumber = () => {
  const queryClient = useQueryClient();

  const method = useMemoizedFn((metricId: string) => {
    const queries = queryClient.getQueriesData<IBusterMetric, any>({
      queryKey: metricsQueryKeys.metricsGetMetric(metricId, null).queryKey.slice(0, -1),
      predicate: filterMetricPredicate
    });

    let latestVersion = -INFINITY;

    for (const [queryKey, data] of queries) {
      if (data && typeof data === 'object' && 'versions' in data) {
        const lastVersion = last(data.versions);
        const version = Number(lastVersion?.version_number);
        if (!isNaN(version)) {
          latestVersion = Math.max(latestVersion, version, data.version_number);
        }
      }
    }

    return latestVersion;
  });

  return method;
};
