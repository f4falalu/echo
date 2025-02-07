import React, { PropsWithChildren, useRef } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useMemoizedFn, useMount } from 'ahooks';
import type { IBusterMetric } from '../interfaces';
import { BusterMetric } from '@/api/asset_interfaces';
import { useTransition } from 'react';
import { resolveEmptyMetric, upgradeMetricToIMetric } from '../helpers';
import { useBusterMetricDataContextSelector } from '../../MetricData';
import { useUpdateMetricConfig } from './useMetricUpdateConfig';
import { useUpdateMetricAssosciations } from './useMetricUpdateAssosciations';
import { useShareMetric } from './useMetricShare';
import { useMetricSubscribe } from './useMetricSubscribe';
import { useParams } from 'next/navigation';

export const useBusterMetricsIndividual = () => {
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

    metricUpdateConfig.onUpdateMetric(upgradedMetric, false);
  });

  // EMITTERS

  const metricSubscribe = useMetricSubscribe({
    metricsRef,
    setMetrics,
    onInitializeMetric
  });

  const metricShare = useShareMetric({ onInitializeMetric });

  const metricAssosciations = useUpdateMetricAssosciations({
    metricsRef,
    setMetrics,
    getMetricMemoized
  });

  const metricUpdateConfig = useUpdateMetricConfig({
    getMetricId,
    setMetrics,
    startTransition,
    onInitializeMetric,
    getMetricMemoized
  });

  return {
    ...metricAssosciations,
    ...metricShare,
    ...metricUpdateConfig,
    ...metricSubscribe,
    resetMetric,
    onInitializeMetric,
    getMetricMemoized,
    metrics: metricsRef.current
  };
};

const BusterMetricsIndividual = createContext<ReturnType<typeof useBusterMetricsIndividual>>(
  {} as ReturnType<typeof useBusterMetricsIndividual>
);

export const BusterMetricsIndividualProvider: React.FC<PropsWithChildren> = React.memo(
  ({ children }) => {
    return (
      <BusterMetricsIndividual.Provider value={useBusterMetricsIndividual()}>
        {children}
      </BusterMetricsIndividual.Provider>
    );
  }
);
BusterMetricsIndividualProvider.displayName = 'BusterMetricsIndividualProvider';

export const useBusterMetricsIndividualContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterMetricsIndividual>, T>
) => {
  return useContextSelector(BusterMetricsIndividual, selector);
};

export const useBusterMetricIndividual = ({ metricId }: { metricId: string }) => {
  const subscribeToMetric = useBusterMetricsIndividualContextSelector((x) => x.subscribeToMetric);
  const fetchDataByMetricId = useBusterMetricDataContextSelector((x) => x.fetchDataByMetricId);
  const metric = useBusterMetricsIndividualContextSelector((x) => x.metrics[metricId]);
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
