import React from 'react';
import type { MetricFileView } from '@/app/app/_layouts/ChatLayout';
import { MetricViewChartController } from './MetricViewChart';
import { MetricViewFile } from './MetricViewFile';
import { MetricViewResults } from './MetricViewResults';

export interface MetricViewProps {
  metricId: string;
}

export const MetricViewComponents: Record<MetricFileView, React.FC<MetricViewProps>> = {
  chart: MetricViewChartController,
  results: MetricViewResults,
  file: MetricViewFile
};
