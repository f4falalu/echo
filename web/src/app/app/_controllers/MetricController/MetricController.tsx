'use client';

import React from 'react';
import { type MetricFileView, useChatLayoutContextSelector } from '../../_layouts/ChatLayout';
import { MetricViewController } from './MetricViewController';

export const MetricController: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  const selectedFileView = useChatLayoutContextSelector(
    (x) => x.selectedFileView
  ) as MetricFileView;

  return <MetricViewController metricId={metricId} selectedFileView={selectedFileView} />;
});

MetricController.displayName = 'MetricController';
