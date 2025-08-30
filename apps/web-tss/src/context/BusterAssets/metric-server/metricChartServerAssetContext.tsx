import { ClientOnly, Outlet } from '@tanstack/react-router';
import { AppSplitter, type LayoutSize } from '@/components/ui/layouts/AppSplitter';
import { MetricViewChartController } from '@/controllers/MetricController/MetricViewChartController';
import {
  useIsMetricEditMode,
  useMetricEditSplitter,
} from '@/layouts/AssetContainer/MetricAssetContainer/MetricContextProvider';
import { useGetMetricParams } from './useGetMetricParams';

const defaultLayoutClosed: LayoutSize = ['auto', '0px'];
const defaultLayoutOpen: LayoutSize = ['auto', '300px'];

export const component = () => {
  const { metricId, metric_version_number } = useGetMetricParams();
  const autoSaveId = `metric-chart-layout-${metricId}`;
  const isMetricEditMode = useIsMetricEditMode();
  const splitterRef = useMetricEditSplitter();

  const defaultLayout = isMetricEditMode ? defaultLayoutOpen : defaultLayoutClosed;

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
        rightChildren={<Outlet />}
        rightPanelMinSize={'250px'}
        rightPanelMaxSize={'500px'}
      />
      <Outlet />
    </ClientOnly>
  );
};
