'use client';

import React, { useRef } from 'react';
import { useChatLayoutContextSelector } from '../../_layouts/ChatLayout';
import { AppSplitter, AppSplitterRef } from '@/components';
import { useMetricControllerLayout } from './useMetricControllerLayout';

const defaultLayout = ['auto', '0px'];

export const MetricController: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  const appSplitterRef = useRef<AppSplitterRef>(null);

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
      leftChildren={<div>{metricId}</div>}
      rightChildren={<div className="min-w-[230px]">right swag</div>}
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
