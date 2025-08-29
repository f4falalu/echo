import { lazy, Suspense } from 'react';
import { CircleSpinnerLoaderContainer } from '../../../components/ui/loaders';
import { useGetMetricParams } from './useGetMetricParams';

const MetricEditController = lazy(() =>
  import('@/controllers/MetricController/MetricViewChart/MetricEditController').then((x) => ({
    default: x.MetricEditController,
  }))
);

export const component = () => {
  const { metricId, metric_version_number } = useGetMetricParams();

  return (
    <Suspense fallback={<CircleSpinnerLoaderContainer />}>
      <MetricEditController metricId={metricId} />
    </Suspense>
  );
};
