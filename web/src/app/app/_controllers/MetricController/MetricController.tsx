'use client';

import React from 'react';
import {
  MetricFileView,
  useChatLayoutContextSelector
} from '@appLayouts/ChatLayout/ChatLayoutContext';
import { MetricViewComponents } from './config';
import { useBusterMetricIndividual } from '@/context/Metrics';
import { FileIndeterminateLoader } from '@appComponents/FileIndeterminateLoader';

export const MetricController: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  const { metric, metricData } = useBusterMetricIndividual({ metricId });
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView) || 'chart';

  const isFetchedConfig = metric.fetched;
  const isFetchedData = metricData.fetched;

  const showLoader = !isFetchedConfig || !isFetchedData;

  const Component = selectedFileView
    ? MetricViewComponents[selectedFileView as MetricFileView]
    : () => null;

  return (
    <>
      {showLoader && <FileIndeterminateLoader />}
      <Component metricId={metricId} />
    </>
  );
});

MetricController.displayName = 'MetricController';
