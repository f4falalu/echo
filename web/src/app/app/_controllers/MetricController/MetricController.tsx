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
  const { metric, isFetchedMetricData } = useBusterMetricIndividual({ metricId });
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView) || 'chart';

  const isFetchedConfig = metric.fetched;

  const showLoader = !isFetchedConfig || !isFetchedMetricData;

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
