import React from 'react';
import type { MetricFileView } from '@/layouts/ChatLayout';
import { MetricViewChart } from './MetricViewChart';
import dynamic from 'next/dynamic';
import { CircleSpinnerLoaderContainer } from '@/components/ui/loaders';

const MetricViewFile = dynamic(() => import('./MetricViewFile').then((mod) => mod.MetricViewFile), {
  loading: () => <CircleSpinnerLoaderContainer />,
  ssr: false
});
const MetricViewResults = dynamic(
  () => import('./MetricViewResults').then((mod) => mod.MetricViewResults),
  {
    loading: () => <CircleSpinnerLoaderContainer />,
    ssr: false
  }
);

export interface MetricViewProps {
  metricId: string;
}

export const MetricViewComponents: Record<
  MetricFileView,
  React.FC<MetricViewProps> | React.ComponentType<MetricViewProps>
> = {
  chart: MetricViewChart,
  results: MetricViewResults,
  file: MetricViewFile
};
