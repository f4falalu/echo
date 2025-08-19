import { useParams, useParentMatches, useSearch } from '@tanstack/react-router';

export const useGetMetricParams = () => {
  const parentMatches = useParentMatches();
  const lastMatch = parentMatches.find((match) => match.fullPath.endsWith('/metrics/$metricId'));
  const routeId = lastMatch?.routeId as
    | '/app/_app/_asset/dashboards/$dashboardId/metrics/$metricId'
    | '/app/_app/_asset/metrics/$metricId';

  const { metricId } = useParams({
    from: routeId,
  });
  const { metric_version_number } = useSearch({
    from: routeId,
  });

  return { metricId, metric_version_number };
};
