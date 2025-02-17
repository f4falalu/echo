import { useMemoizedFn } from 'ahooks';
import { useBusterAssetsContextSelector } from '../../Assets/BusterAssetsProvider';
import { IBusterMetric } from '../interfaces';
import { useBusterWebSocket } from '../../BusterWebSocket';
import { BusterMetric } from '@/api/asset_interfaces';
import { RustApiError } from '@/api/buster_rest/errors';
import { resolveEmptyMetric, upgradeMetricToIMetric } from '../helpers';
import React from 'react';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
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

  const { mutate: subscribeToMetricMutation } = useSocketQueryMutation(
    '/metrics/get',
    '/metrics/get:updateMetricState',
    null,
    null,
    (newData, currentData, variables) => {
      onInitializeMetric(newData);
    }
  );

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
