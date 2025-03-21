'use client';

import React from 'react';
import {
  MetricFileView,
  useChatLayoutContextSelector
} from '@/layouts/ChatLayout/ChatLayoutContext';
import { MetricViewComponents } from './config';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';

export const MetricController: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  const { isFetched: isMetricFetched } = useGetMetric({ id: metricId });
  const { isFetched: isMetricDataFetched } = useGetMetricData({ id: metricId });
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView) || 'chart';

  const showLoader = !isMetricFetched || !isMetricDataFetched;

  const Component =
    isMetricFetched && selectedFileView in MetricViewComponents
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
