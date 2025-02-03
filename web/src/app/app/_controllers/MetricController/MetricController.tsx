'use client';

import React, { useRef } from 'react';
import { MetricFileView, useChatLayoutContextSelector } from '../../_layouts/ChatLayout';
import { AppSplitter, AppSplitterRef } from '@/components/layout/AppSplitter';
import { useMetricControllerLayout } from './useMetricControllerLayout';
import { MetricViewController } from './MetricViewController';
import { MetricEditController } from './MetricEditController';

const defaultLayout = ['auto', '0px'];

export const MetricController: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  const appSplitterRef = useRef<AppSplitterRef>(null);

  const selectedFileView = useChatLayoutContextSelector(
    (x) => x.selectedFileView
  ) as MetricFileView;
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );

  const { renderSecondary } = useMetricControllerLayout({
    selectedFileViewSecondary,
    appSplitterRef
  });

  return (
    <AppSplitter
      ref={appSplitterRef}
      leftChildren={<MetricViewController selectedFileView={selectedFileView} />}
      rightChildren={<MetricEditController />}
      rightHidden={!renderSecondary}
      autoSaveId="metric-controller"
      defaultLayout={defaultLayout}
      preserveSide={'right'}
      rightPanelMinSize={250}
      rightPanelMaxSize={360}
    />
  );
});

MetricController.displayName = 'MetricController';
