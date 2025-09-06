import { MetricViewResultsController } from '@/controllers/MetricController/MetricViewResults';
import { useGetMetricParams } from '../../Metrics/useGetMetricParams';

export const component = () => {
  const { metricId, metricVersionNumber } = useGetMetricParams();

  return <MetricViewResultsController metricId={metricId} versionNumber={metricVersionNumber} />;
};
