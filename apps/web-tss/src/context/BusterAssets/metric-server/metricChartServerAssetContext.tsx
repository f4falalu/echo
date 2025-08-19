import { getRouteApi } from '@tanstack/react-router';
import { MetricViewChart } from '@/controllers/MetricController/MetricViewChart';

const Route = getRouteApi('/app/_app/_asset/metrics/$metricId');

export const component = () => {
  const { metricId } = Route.useParams();
  const { metric_version_number } = Route.useSearch();

  return <MetricViewChart metricId={metricId} versionNumber={metric_version_number} />;
};
