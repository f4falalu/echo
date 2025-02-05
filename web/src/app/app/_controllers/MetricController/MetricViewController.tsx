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
      {showLoader && <MetricViewLoader />}
      <Component metricId={metricId} selectedFileView={selectedFileView} />
    </>
  );
});

MetricViewController.displayName = 'MetricViewController';

const MetricViewLoader: React.FC = () => {
  return (
    <div className="relative z-10 h-0 overflow-visible">
      <IndeterminateLinearLoader className="absolute left-0 top-0 w-full" />
    </div>
  );
};
