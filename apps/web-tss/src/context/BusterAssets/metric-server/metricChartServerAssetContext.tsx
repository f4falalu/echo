import { ClientOnly, Outlet } from '@tanstack/react-router';
import { lazy, Suspense, useRef } from 'react';
import { AppSplitter, type LayoutSize } from '@/components/ui/layouts/AppSplitter';
import { MetricViewChartController } from '@/controllers/MetricController/MetricViewChartController';
import {
  useIsMetricEditMode,
  useMetricEditSplitter,
} from '@/layouts/AssetContainer/MetricAssetContainer/MetricContextProvider';
import { CircleSpinnerLoaderContainer } from '../../../components/ui/loaders';
import { useGetMetricParams } from './useGetMetricParams';

const MetricEditController = lazy(() =>
  import('@/controllers/MetricController/MetricViewChartController/MetricEditController').then(
    (x) => ({
      default: x.MetricEditController,
    })
  )
);

const defaultLayoutClosed: LayoutSize = ['auto', '0px'];
const defaultLayoutOpen: LayoutSize = ['auto', '300px'];

export const component = () => {
  const { metricId, metric_version_number } = useGetMetricParams();
  const autoSaveId = `metric-chart-layout-${metricId}`;
  const isMetricEditMode = useIsMetricEditMode();
  const splitterRef = useMetricEditSplitter();

  const hasSeenMetricEditMode = useRef(false);

  const defaultLayout = isMetricEditMode ? defaultLayoutOpen : defaultLayoutClosed;

  if (isMetricEditMode && !hasSeenMetricEditMode.current) {
    hasSeenMetricEditMode.current = true;
  }

  return (
    <ClientOnly>
      <AppSplitter
        ref={splitterRef}
        autoSaveId={autoSaveId}
        defaultLayout={defaultLayout}
        initialLayout={defaultLayout}
        preserveSide="right"
        leftChildren={
          <MetricViewChartController metricId={metricId} versionNumber={metric_version_number} />
        }
        rightChildren={
          <RightChildren metricId={metricId} renderChart={hasSeenMetricEditMode.current} />
        }
        rightPanelMinSize={'250px'}
        rightPanelMaxSize={'500px'}
      />
      <Outlet />
    </ClientOnly>
  );
};

const RightChildren = ({ metricId, renderChart }: { metricId: string; renderChart: boolean }) => {
  return renderChart ? (
    <Suspense fallback={<CircleSpinnerLoaderContainer />}>
      <MetricEditController metricId={metricId} />
    </Suspense>
  ) : null;
};
