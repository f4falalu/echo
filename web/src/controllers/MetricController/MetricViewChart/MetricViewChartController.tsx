'use client';

import React, { useMemo, useRef } from 'react';
import type { MetricViewProps } from '../config';
import { AppSplitter, AppSplitterRef } from '@/components/ui/layouts';
import { MetricViewChart } from './MetricViewChart';
import { MetricEditController } from './MetricEditController';
import { useMetricLayout } from '../useMetricLayout';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { VersionHistoryPanel } from '@/components/features/versionHistory';

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

  const RightChildren = useMemo(() => {
    if (!renderSecondary) return null;
    if (selectedFileViewSecondary === 'chart-edit')
      return <MetricEditController metricId={metricId} />;
    if (selectedFileViewSecondary === 'version-history')
      return <VersionHistoryPanel assetId={metricId} type="metric" />;
    return null;
  }, [renderSecondary, metricId]);

  return (
    <AppSplitter
      ref={appSplitterRef}
      initialReady={false}
      leftChildren={<MetricViewChart metricId={metricId} />}
      rightChildren={RightChildren}
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
