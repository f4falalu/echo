import { useParams, useParentMatches, useSearch } from '@tanstack/react-router';

const stableMetricParams = (params?: { metricId?: string }) => ({
  metricId: params?.metricId || '',
});
const stableMetricSearch = (search?: { metric_version_number?: number }) => ({
  metric_version_number: search?.metric_version_number,
});

export const useGetMetricParams = () => {
  const { metricId } = useParams({
    strict: false,
    select: stableMetricParams,
  });
  const { metric_version_number } = useSearch({
    strict: false,
    select: stableMetricSearch,
  });

  return { metricId, metric_version_number };
};
