import { getRouteApi } from '@tanstack/react-router';
import { MetricViewResultsController } from '@/controllers/MetricController/MetricViewResults';

const Route = getRouteApi('/app/_app/_asset/metrics/$metricId');

export const component = () => {
  const { metricId } = Route.useParams();
  const { metric_version_number } = Route.useSearch();
  return <MetricViewResultsController metricId={metricId} versionNumber={metric_version_number} />;
};
