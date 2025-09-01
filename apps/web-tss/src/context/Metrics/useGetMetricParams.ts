import { useParams, useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';

const stableMetricParams = ({ metricId }: { metricId?: string }) => ({
  metricId,
});
const stableMetricSearch = (search?: { metric_version_number?: number }) => ({
  metric_version_number: search?.metric_version_number,
});

export const useGetMetricParams = () => {
  const { metricId = '' } = useParams({
    strict: false,
    select: stableMetricParams,
  });
  const { metric_version_number } = useSearch({
    strict: false,
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
