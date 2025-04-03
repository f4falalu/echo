import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { create } from 'zustand';
import isEqual from 'lodash/isEqual';
import { useQueryClient } from '@tanstack/react-query';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import pick from 'lodash/pick';
import { compareObjectsByKeys } from '@/lib/objects';

export const useOriginalMetricStore = create<{
  originalMetrics: Record<string, IBusterMetric>;
  setOriginalMetric: (metric: IBusterMetric) => void;
  getOriginalMetric: (metricId: string) => IBusterMetric | undefined;
  removeOriginalMetric: (metricId: string) => void;
}>((set, get) => ({
  originalMetrics: {},
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

export const useIsMetricChanged = ({ metricId }: { metricId: string }) => {
  const queryClient = useQueryClient();
  const options = metricsQueryKeys.metricsGetMetric(metricId);
  const originalMetric = useOriginalMetricStore.getState().getOriginalMetric(metricId);
  const currentMetric = queryClient.getQueryData<IBusterMetric>(options.queryKey);

  if (!originalMetric || !currentMetric) {
    return false;
  }

  return !compareObjectsByKeys(originalMetric, currentMetric, [
    'name',
    'description',
    'chart_config',
    'file'
  ]);
};
