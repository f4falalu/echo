'use client';

import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { create } from 'zustand';
import { compareObjectsByKeys } from '@/lib/objects';
import { useGetMetric } from '@/api/buster_rest/metrics/queryRequests';
import { useMemoizedFn, useMount } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { metricsQueryKeys } from '@/api/query_keys/metric';

type OriginalMetricStore = {
  originalMetrics: Record<string, IBusterMetric>;
  bulkAddOriginalMetrics: (metrics: Record<string, IBusterMetric>) => void;
  setOriginalMetric: (metric: IBusterMetric) => void;
  getOriginalMetric: (metricId: string) => IBusterMetric | undefined;
  removeOriginalMetric: (metricId: string) => void;
};

export const useOriginalMetricStore = create<OriginalMetricStore>((set, get) => ({
  originalMetrics: {},
  bulkAddOriginalMetrics: (metrics: Record<string, IBusterMetric>) =>
    set((prev) => ({
      originalMetrics: {
        ...prev.originalMetrics,
        ...metrics
      }
    })),
  setOriginalMetric: (metric: IBusterMetric) =>
    set((state) => ({
      originalMetrics: {
        ...state.originalMetrics,
        [metric.id]: metric
      }
    })),
  getOriginalMetric: (metricId: string) => get().originalMetrics[metricId],
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
