import { useQueryClient } from '@tanstack/react-query';
import { useOriginalMetricStore } from './useOriginalMetricStore';
import { useMemoizedFn } from '@/hooks';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { compareObjectsByKeys } from '@/lib/objects';

export const useIsMetricChanged = ({ metricId }: { metricId: string }) => {
  const queryClient = useQueryClient();
  const originalMetric = useOriginalMetricStore((x) => x.getOriginalMetric(metricId));

  const { data: currentMetric, refetch: refetchCurrentMetric } = useGetMetric(
    { id: metricId },
    {
      select: (x) => ({
        name: x.name,
        description: x.description,
        chart_config: x.chart_config,
        file: x.file
      })
    }
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
