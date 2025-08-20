import { useParams, useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';

const stableMetricParams = ({ metricId }: { metricId: string }) => ({
  metricId,
});
const stableMetricSearch = (search?: { metric_version_number?: number }) => ({
  metric_version_number: search?.metric_version_number || ('LATEST' as const),
});

export const useGetMetricParams = () => {
  const { metricId } = useParams({
    from: '/app/_app/_asset/metrics/$metricId',
    select: stableMetricParams,
  });
  const { metric_version_number } = useSearch({
    from: '/app/_app/_asset/metrics/$metricId',
    select: stableMetricSearch,
  });

  return useMemo(
    () => ({
      metricId,
      metricVersionNumber: metric_version_number,
    }),
    [metricId, metric_version_number]
  );
};
