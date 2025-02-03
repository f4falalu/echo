'use client';

import React from 'react';

export const MetricController: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  return <div>MetricController</div>;
});

MetricController.displayName = 'MetricController';
