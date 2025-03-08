import { useMemoizedFn } from '@/hooks';
import { useBusterAssetsContextSelector } from '../../Assets/BusterAssetsProvider';
import type { BusterMetric, IBusterMetric } from '@/api/asset_interfaces/metric';
import type { RustApiError } from '@/api/buster_rest/errors';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { useQueryClient } from '@tanstack/react-query';

export const useMetricSubscribe = ({
  getMetricMemoized,
  onInitializeMetric
}: {
  getMetricMemoized: ({ metricId }: { metricId?: string }) => IBusterMetric;
  onInitializeMetric: (metric: BusterMetric) => void;
}) => {
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const setAssetPasswordError = useBusterAssetsContextSelector(
    (state) => state.setAssetPasswordError
  );
  const queryClient = useQueryClient();

  const { mutate: subscribeToMetricMutation } = useSocketQueryMutation({
    emitEvent: '/metrics/get',
    responseEvent: '/metrics/get:updateMetricState',
    callback: (newData, currentData, variables) => {
      onInitializeMetric(newData);
      return currentData;
    }
  });

  const _onGetMetricStateError = useMemoizedFn((_error: any, metricId: string) => {
    const error = _error as RustApiError;
    setAssetPasswordError(metricId, error.message || 'An error occurred');
  });

  const subscribeToMetric = useMemoizedFn(async ({ metricId }: { metricId: string }) => {
    const { password } = getAssetPassword(metricId);

    try {
      const result = await subscribeToMetricMutation({
        id: metricId,
        password
      });
    } catch (_error) {
      const error = _error as RustApiError;
      setAssetPasswordError(metricId, error.message || 'An error occurred');
    }
  });

  return {
    subscribeToMetric
  };
};
