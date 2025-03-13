'use client';

import React from 'react';
import {
  MetricFileView,
  useChatLayoutContextSelector
} from '@/layouts/ChatLayout/ChatLayoutContext';
import { MetricViewComponents } from './config';
import { useMetricIndividual } from '@/api/buster_rest/metrics';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';

export const MetricController: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  const { isMetricFetched, isFetchedMetricData } = useMetricIndividual({ metricId });
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView) || 'chart';

  const showLoader = !isMetricFetched || !isFetchedMetricData;

  const Component =
    selectedFileView in MetricViewComponents
      ? MetricViewComponents[selectedFileView as MetricFileView]
      : () => <></>;

  return (
    <>
      {showLoader && <FileIndeterminateLoader />}
      {Component && <Component metricId={metricId} />}
    </>
  );
});

MetricController.displayName = 'MetricController';
