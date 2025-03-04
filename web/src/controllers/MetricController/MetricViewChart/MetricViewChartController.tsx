import React, { useRef } from 'react';
import type { MetricViewProps } from '../config';
import { AppSplitter, AppSplitterRef } from '@/components/ui/layouts';
import { MetricViewChart } from './MetricViewChart';
import { MetricEditController } from './MetricEditController';
import { useMetricLayout } from '../useMetricLayout';
import { useChatLayoutContextSelector } from '@layouts/ChatLayout';

const autoSaveId = 'metric-edit-chart';

export const MetricViewChartController: React.FC<MetricViewProps> = React.memo(({ metricId }) => {
  const appSplitterRef = useRef<AppSplitterRef>(null);
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );

  const { renderSecondary, defaultLayout } = useMetricLayout({
    selectedFileViewSecondary,
    appSplitterRef,
    autoSaveId,
    type: 'chart'
  });

  return (
    <AppSplitter
      ref={appSplitterRef}
      initialReady={false}
      leftChildren={<MetricViewChart metricId={metricId} />}
      rightChildren={<MetricEditController metricId={metricId} />}
      rightHidden={!renderSecondary}
      autoSaveId={autoSaveId}
      defaultLayout={defaultLayout}
      preserveSide={'right'}
      rightPanelMinSize={250}
      rightPanelMaxSize={360}
    />
  );
});

MetricViewChartController.displayName = 'MetricViewChartController';
