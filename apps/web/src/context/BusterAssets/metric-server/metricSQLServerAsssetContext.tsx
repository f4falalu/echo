import { MetricViewSQLController } from '@/controllers/MetricController/MetricViewSQL';
import { useGetMetricParams } from '../../Metrics/useGetMetricParams';

export const component = () => {
  const { metricId, metricVersionNumber } = useGetMetricParams();
  return (
    <MetricViewSQLController
      metricId={metricId}
      versionNumber={metricVersionNumber}
      initialLayout={null}
    />
  );
};
