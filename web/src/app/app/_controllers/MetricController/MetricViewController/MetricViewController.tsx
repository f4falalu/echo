import React from 'react';
import { MetricFileView } from '@appLayouts/ChatLayout/ChatLayoutContext';
import { MetricViewComponents } from './config';
import { IndeterminateLinearLoader } from '@/components/loaders/IndeterminateLinearLoader';
import { useBusterMetricIndividual } from '@/context/Metrics';
import { useBusterNewChatContextSelector } from '@/context/Chats';

export const MetricViewController: React.FC<{
  metricId: string;
  selectedFileView: MetricFileView | undefined;
}> = React.memo(({ metricId, selectedFileView = 'chart' }) => {
  const { metric, metricData } = useBusterMetricIndividual({ metricId });
  const loadingNewChat = useBusterNewChatContextSelector((x) => x.loadingNewChat);

  const isFetchedConfig = metric.fetched;
  const isFetchedData = metricData.fetched;

  const showLoader = !isFetchedConfig || !isFetchedData || loadingNewChat;

  const Component = selectedFileView ? MetricViewComponents[selectedFileView] : () => null;

  return (
    <>
      {showLoader && <IndeterminateLinearLoader className="absolute left-0 top-0 z-10 w-full" />}
      <Component metricId={metricId} selectedFileView={selectedFileView} />
    </>
  );
});

MetricViewController.displayName = 'MetricViewController';
