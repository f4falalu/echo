import { IBusterMetric } from '@/api/asset_interfaces';
import { queryKeys } from '@/api/query_keys';
import { useMemoizedFn, useDebounceFn } from '@/hooks';
import { prepareMetricUpdateMetric } from '@/lib/metrics';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useSaveMetric } from './queryRequests';
import { create } from 'mutative';
/**
 * This is a mutation that updates a metric.
 * It will create a new metric with the new values combined with the old values and save it to the server.
 * It will also strip out any values that are not changed from the DEFAULT_CHART_CONFIG.
 * It will also update the draft_session_id if it exists.
 */
export const useUpdateMetric = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: saveMetric } = useSaveMetric();

  const { run: saveMetricDebounced } = useDebounceFn(
    (newMetric: IBusterMetric, prevMetric: IBusterMetric) => {
      const changedValues = prepareMetricUpdateMetric(newMetric, prevMetric);
      if (changedValues) {
        saveMetric(changedValues);
      }
    },
    { wait: 650 }
  );

  const combineAndSaveMetric = useMemoizedFn(
    async (newMetricPartial: Partial<IBusterMetric> & { id: string }) => {
      const metricId = newMetricPartial.id;
      const options = queryKeys.metricsGetMetric(metricId);
      const prevMetric = queryClient.getQueryData(options.queryKey);
      const newMetric = create(prevMetric, (draft) => {
        Object.assign(draft || {}, newMetricPartial);
      });

      if (prevMetric && newMetric) {
        queryClient.setQueryData(options.queryKey, newMetric);
      }

      return { newMetric, prevMetric };
    }
  );

  const mutationFn = useMemoizedFn(
    async (newMetricPartial: Partial<IBusterMetric> & { id: string }) => {
      const { newMetric, prevMetric } = await combineAndSaveMetric(newMetricPartial);
      if (newMetric && prevMetric) {
        saveMetricDebounced(newMetric, prevMetric);
      }
      return Promise.resolve(newMetric!);
    }
  );

  const mutationRes = useMutation({
    mutationFn: mutationFn
  });

  return mutationRes;
};
