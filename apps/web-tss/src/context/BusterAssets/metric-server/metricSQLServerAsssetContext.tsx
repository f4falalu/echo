import { getRouteApi } from '@tanstack/react-router';
import { MetricViewSQLController } from '@/controllers/MetricController/MetricViewSQL';

const Route = getRouteApi('/app/_app/_asset/metrics/$metricId');

export const component = () => {
  const { metricId } = Route.useParams();
  const { metric_version_number } = Route.useSearch();
  return (
    <MetricViewSQLController
      metricId={metricId}
      versionNumber={metric_version_number}
      initialLayout={null}
    />
  );
};
