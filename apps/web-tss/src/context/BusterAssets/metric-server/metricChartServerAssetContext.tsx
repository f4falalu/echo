import { MetricViewChart } from '@/controllers/MetricController/MetricViewChart';
import { useGetMetricParams } from './useGetMetricParams';

export const component = () => {
  const { metricId, metric_version_number } = useGetMetricParams();

  return <MetricViewChart metricId={metricId} versionNumber={metric_version_number} />;
};
