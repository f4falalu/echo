import { useMemoizedFn } from 'ahooks';
import { useBusterAssetsContextSelector } from '../../Assets/BusterAssetsProvider';
import { IBusterMetric } from '../interfaces';
import { createMockMetric } from './MOCK_METRIC';
import { useBusterWebSocket } from '../../BusterWebSocket';
import { BusterMetric } from '@/api/asset_interfaces';
import { RustApiError } from '@/api/buster_rest/errors';
import { resolveEmptyMetric } from '../helpers';
import React from 'react';

export const useMetricSubscribe = ({
  metricsRef,
  onInitializeMetric,
  setMetrics
}: {
  metricsRef: React.MutableRefObject<Record<string, IBusterMetric>>;
  onInitializeMetric: (metric: BusterMetric) => void;
  setMetrics: (newMetrics: Record<string, IBusterMetric>) => void;
}) => {
  const busterSocket = useBusterWebSocket();
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const setAssetPasswordError = useBusterAssetsContextSelector(
    (state) => state.setAssetPasswordError
  );

  const _onGetMetricState = useMemoizedFn((metric: BusterMetric) => {
    onInitializeMetric(metric);
  });

  const _onGetMetricStateError = useMemoizedFn((_error: any, metricId: string) => {
    const error = _error as RustApiError;
    setAssetPasswordError(metricId, error.message || 'An error occurred');
  });

  const _setLoadingMetric = useMemoizedFn((metricId: string) => {
    const metrics = metricsRef.current || {};
    metrics[metricId] = resolveEmptyMetric(
      {
        ...metrics[metricId],
        fetching: true
      },
      metricId
    );

    setMetrics(metrics);

    return metrics[metricId];
  });

  const subscribeToMetric = useMemoizedFn(async ({ metricId }: { metricId: string }) => {
    const { password } = getAssetPassword(metricId);
    const foundMetric: undefined | IBusterMetric = metricsRef.current[metricId];

    if (foundMetric && (foundMetric?.fetching || foundMetric?.fetched)) {
      return foundMetric;
    }

    _setLoadingMetric(metricId);

    //TODO: remove this
    setTimeout(() => {
      _onGetMetricState(createMockMetric(metricId));
    }, 300);

    return await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/metrics/get',
        payload: {
          id: metricId,
          password
        }
      },
      responseEvent: {
        route: '/metrics/get:updateMetricState',
        callback: _onGetMetricState,
        onError: (error) => _onGetMetricStateError(error, metricId)
      }
    });
  });

  const unsubscribeToMetricEvents = useMemoizedFn(({ metricId }: { metricId: string }) => {
    busterSocket.off({
      route: '/metrics/get:updateMetricState',
      callback: onInitializeMetric
    });
    busterSocket.off({
      route: '/metrics/update:updateMetricState',
      callback: onInitializeMetric
    });
  });

  return {
    unsubscribeToMetricEvents,
    subscribeToMetric
  };
};
