import {
  useChildMatches,
  useLinkProps,
  useLocation,
  useMatch,
  useMatchRoute,
  useParams,
  useParentMatches,
  useSearch,
  useStableCallback,
} from '@tanstack/react-router';
import { MetricViewChart } from '@/controllers/MetricController/MetricViewChart';
import { useGetMetricParams } from './useGetMetricParams';

//const Route = getRouteApi('/app/_app/_asset/metrics/$metricId');

export const component = () => {
  const { metricId, metric_version_number } = useGetMetricParams();

  return <MetricViewChart metricId={metricId} versionNumber={metric_version_number} />;
};
