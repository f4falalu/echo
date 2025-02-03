import { MetricFileView } from '@appLayouts/ChatLayout/ChatLayoutContext';
import React from 'react';
import { MetricViewComponents } from './config';

export const MetricViewController: React.FC<{
  selectedFileView: MetricFileView | undefined;
}> = React.memo(({ selectedFileView }) => {
  if (!selectedFileView) return null;

  const Component = MetricViewComponents[selectedFileView];

  return <Component selectedFileView={selectedFileView} />;
});

MetricViewController.displayName = 'MetricViewController';
