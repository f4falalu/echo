'use client';

import React from 'react';
import {
  MetricFileView,
  useChatLayoutContextSelector
} from '@/layouts/ChatLayout/ChatLayoutContext';
import { MetricViewComponents } from './config';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { useMount } from '@/hooks';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';

export const MetricController: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  const { isFetched: isMetricFetched } = useGetMetric({ id: metricId });
  const { isFetched: isMetricDataFetched } = useGetMetricData({ id: metricId });
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView) || 'chart';

  const showLoader = !isMetricFetched || !isMetricDataFetched;

  const Component =
    selectedFileView in MetricViewComponents
      ? MetricViewComponents[selectedFileView as MetricFileView]
      : () => <></>;

  console.log('here', metricId);

  useMount(() => {
    console.log('mounted', metricId);
  });

  return (
    <>
      {showLoader && <FileIndeterminateLoader />}
      {Component && <Component metricId={metricId} />}
    </>
  );
});

MetricController.displayName = 'MetricController';
