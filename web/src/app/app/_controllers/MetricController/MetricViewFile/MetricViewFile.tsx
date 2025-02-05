import React from 'react';
import type { MetricViewProps } from '../config';

export const MetricViewFile: React.FC<MetricViewProps> = React.memo(({ metricId }) => {
  return <div>MetricViewFile</div>;
});

MetricViewFile.displayName = 'MetricViewFile';
