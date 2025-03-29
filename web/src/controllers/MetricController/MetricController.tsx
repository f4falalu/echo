'use client';

import React from 'react';
import {
  MetricFileView,
  useChatLayoutContextSelector
} from '@/layouts/ChatLayout/ChatLayoutContext';
import { MetricViewComponents } from './config';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { MetricViewError } from './MetricViewError';

/*
TODO: consider makiing this a server component that fetches the metric and metric data?
As long as we have a loading.tsx component that can handle the loading state, this should work?
*/

export const MetricController: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  const { isFetched: isMetricFetched, error: metricError } = useGetMetric({ id: metricId });
  const { isFetched: isMetricDataFetched } = useGetMetricData({ id: metricId });
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView) || 'chart';

  const showLoader = !isMetricFetched || !isMetricDataFetched;

  const Component = React.useMemo(() => {
    if (metricError) {
      return <MetricViewError error={metricError.message} />;
    }

    if (isMetricFetched && selectedFileView in MetricViewComponents) {
      const Component = MetricViewComponents[selectedFileView as MetricFileView];
      return <Component metricId={metricId} />;
    }

    return null;
  }, [isMetricFetched, selectedFileView, metricError, metricId]);

  return (
    <>
      {showLoader && <FileIndeterminateLoader />}
      {Component}
    </>
  );
});

MetricController.displayName = 'MetricController';
