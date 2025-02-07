import React, { PropsWithChildren, useRef, useState } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { BusterMetricsListProvider } from './BusterMetricsListProvider';
import { useMemoizedFn, useMount } from 'ahooks';
import type { IBusterMetric } from './interfaces';
import { BusterMetric } from '@/api/asset_interfaces';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useParams } from 'next/navigation';
import { useBusterAssetsContextSelector } from '../Assets/BusterAssetsProvider';
import { useBusterNotifications } from '../BusterNotifications';
import { useTransition } from 'react';
import { RustApiError } from '@/api/buster_rest/errors';
import { resolveEmptyMetric, upgradeMetricToIMetric } from './helpers';
import { MetricUpdateMetric } from '@/api/buster_socket/metrics';
import { useBusterMetricDataContextSelector } from '../MetricData';
import { createMockMetric } from './MOCK_METRIC';
import { useUpdateMetricConfig } from './useUpdateMetricConfig';
import { useUpdateMetricAssosciations } from './useUpdateMetricAssosciations';
import { useShareMetric } from './useShareMetric';
import { useMetricSubscribe } from './useMetricSubscribe';

export const useBusterMetrics = () => {
  const [isPending, startTransition] = useTransition();
  const { metricId: selectedMetricId } = useParams<{ metricId: string }>();
  const metricsRef = useRef<Record<string, IBusterMetric>>({});

  const getMetricId = useMemoizedFn((metricId?: string): string => {
    return metricId || selectedMetricId;
  });

  const setMetrics = useMemoizedFn((newMetrics: Record<string, IBusterMetric>) => {
    metricsRef.current = { ...metricsRef.current, ...newMetrics };
    startTransition(() => {
      //trigger a rerender
    });
  });

  const resetMetric = useMemoizedFn(({ metricId }: { metricId: string }) => {
    const prev = metricsRef.current;
    delete prev[metricId];
    setMetrics(prev);
  });

  //UI SELECTORS

  const getMetricMemoized = useMemoizedFn(({ metricId }: { metricId?: string }): IBusterMetric => {
    const _metricId = getMetricId(metricId);
    const metrics = metricsRef.current || {};
    const currentMetric = metrics[_metricId];
    return resolveEmptyMetric(currentMetric, _metricId);
  });

  //STATE UPDATERS

  const onInitializeMetric = useMemoizedFn((newMetric: BusterMetric) => {
    const metrics = metricsRef.current || {};

    const oldMetric = metrics[newMetric.id] as IBusterMetric | undefined; //HMMM is this right?

    const upgradedMetric = upgradeMetricToIMetric(newMetric, oldMetric);

    onUpdateMetric(upgradedMetric, false);
  });

  const bulkUpdateMetrics = useMemoizedFn((newMetrics: Record<string, IBusterMetric>) => {
    metricsRef.current = {
      ...metricsRef.current,
      ...newMetrics
    };
  });

  // EMITTERS

  const { subscribeToMetric, unsubscribeToMetricEvents } = useMetricSubscribe({
    metricsRef,
    setMetrics,
    onInitializeMetric
  });

  const { onShareMetric } = useShareMetric({ onInitializeMetric });

  const {
    saveMetricToDashboard,
    saveMetricToCollection,
    removeMetricFromDashboard,
    removeMetricFromCollection,
    deleteMetric
  } = useUpdateMetricAssosciations({
    metricsRef,
    setMetrics,
    getMetricMemoized
  });

  const {
    onVerifiedMetric,
    onUpdateMetric,
    onUpdateMetricChartConfig,
    onUpdateColumnLabelFormat,
    onUpdateColumnSetting,
    updateMetricToServer,
    onSaveMetricChanges
  } = useUpdateMetricConfig({
    getMetricId,
    setMetrics,
    startTransition,
    onInitializeMetric,
    getMetricMemoized
  });

  return {
    resetMetric,
    deleteMetric,
    onVerifiedMetric,
    onShareMetric,
    onUpdateMetric,
    onInitializeMetric,
    subscribeToMetric,
    unsubscribeToMetricEvents,
    onUpdateMetricChartConfig,
    updateMetricToServer,
    onUpdateColumnLabelFormat,
    onUpdateColumnSetting,
    saveMetricToDashboard,
    removeMetricFromDashboard,
    removeMetricFromCollection,
    saveMetricToCollection,
    onSaveMetricChanges,
    getMetricMemoized,
    metrics: metricsRef.current
  };
};

const BusterMetrics = createContext<ReturnType<typeof useBusterMetrics>>(
  {} as ReturnType<typeof useBusterMetrics>
);

export const BusterMetricsProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  return (
    <BusterMetrics.Provider value={useBusterMetrics()}>
      <BusterMetricsListProvider>{children}</BusterMetricsListProvider>
    </BusterMetrics.Provider>
  );
});
BusterMetricsProvider.displayName = 'BusterMetricsProvider';

export const useBusterMetricsContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterMetrics>, T>
) => {
  return useContextSelector(BusterMetrics, selector);
};

export const useBusterMetricIndividual = ({ metricId }: { metricId: string }) => {
  const subscribeToMetric = useBusterMetricsContextSelector((x) => x.subscribeToMetric);
  const fetchDataByMetricId = useBusterMetricDataContextSelector((x) => x.fetchDataByMetricId);
  const metric = useBusterMetricsContextSelector((x) => x.metrics[metricId]);
  const metricData = useBusterMetricDataContextSelector(({ getDataByMetricId }) =>
    getDataByMetricId(metricId)
  );

  useMount(() => {
    subscribeToMetric({ metricId });
    fetchDataByMetricId({ metricId });
  });

  return {
    metric: resolveEmptyMetric(metric, metricId),
    metricData
  };
};
