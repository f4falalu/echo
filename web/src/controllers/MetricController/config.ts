import React from 'react';
import type { MetricFileView } from '@/layouts/ChatLayout';
import { MetricViewChartController } from './MetricViewChart';
import { MetricViewFile } from './MetricViewFile';
import { MetricViewResults } from './MetricViewResults';
import { MetricViewChart } from './MetricViewChart';

export interface MetricViewProps {
  metricId: string;
}

export const MetricViewComponents: Record<MetricFileView, React.FC<MetricViewProps>> = {
  chart: MetricViewChart,
  results: MetricViewResults,
  file: MetricViewFile
};
