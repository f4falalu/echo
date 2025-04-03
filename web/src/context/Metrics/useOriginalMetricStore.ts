import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { create } from 'zustand';
import { compareObjectsByKeys } from '@/lib/objects';
import { useGetMetric } from '@/api/buster_rest/metrics/queryRequests';
import { useMemoizedFn } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { metricsQueryKeys } from '@/api/query_keys/metric';

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
  const originalMetric = useOriginalMetricStore((x) => x.getOriginalMetric(metricId));

  const { data: currentMetric, refetch: refetchCurrentMetric } = useGetMetric(
    { id: metricId },
    (x) => ({
      name: x.name,
      description: x.description,
      chart_config: x.chart_config,
      file: x.file
    })
  );

  const onResetMetricToOriginal = useMemoizedFn(() => {
    const options = metricsQueryKeys.metricsGetMetric(metricId);
    if (originalMetric) {
      queryClient.setQueryData(options.queryKey, originalMetric);
    }
    refetchCurrentMetric();
  });

  return {
    onResetMetricToOriginal,
    isMetricChanged:
      !originalMetric ||
      !currentMetric ||
      !compareObjectsByKeys(originalMetric, currentMetric, [
        'name',
        'description',
        'chart_config',
        'file'
      ])
  };
};
