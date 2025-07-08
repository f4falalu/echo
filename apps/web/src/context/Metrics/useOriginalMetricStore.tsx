'use client';

import { create } from 'zustand';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useMount } from '@/hooks';

type OriginalMetricStore = {
  originalMetrics: Record<string, BusterMetric>;
  bulkAddOriginalMetrics: (metrics: Record<string, BusterMetric>) => void;
  setOriginalMetric: (metric: BusterMetric) => void;
  getOriginalMetric: (metricId: string | undefined) => BusterMetric | undefined;
  removeOriginalMetric: (metricId: string) => void;
};

export const useOriginalMetricStore = create<OriginalMetricStore>((set, get) => ({
  originalMetrics: {},
  bulkAddOriginalMetrics: (metrics: Record<string, BusterMetric>) =>
    set((prev) => ({
      originalMetrics: {
        ...prev.originalMetrics,
        ...metrics
      }
    })),
  setOriginalMetric: (metric: BusterMetric) =>
    set((state) => ({
      originalMetrics: {
        ...state.originalMetrics,
        [metric.id]: metric
      }
    })),
  getOriginalMetric: (metricId: string | undefined) =>
    metricId ? get().originalMetrics[metricId] : undefined,
  removeOriginalMetric: (metricId: string) =>
    set((state) => {
      const { [metricId]: removed, ...rest } = state.originalMetrics;
      return { originalMetrics: rest };
    })
}));

export const HydrationBoundaryMetricStore: React.FC<{
  children: React.ReactNode;
  metric?: OriginalMetricStore['originalMetrics'][string];
}> = ({ children, metric }) => {
  const setOriginalMetrics = useOriginalMetricStore((x) => x.setOriginalMetric);

  useMount(() => {
    if (metric) setOriginalMetrics(metric);
  });

  return <>{children}</>;
};
