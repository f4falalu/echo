import React, { PropsWithChildren } from 'react';
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
import { useUpdateMetricConfig } from './useMetricUpdateConfig';
import { useUpdateMetricAssosciations } from './useMetricUpdateAssosciations';
import { useShareMetric } from './useMetricShare';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';

export const useBusterMetricsIndividual = () => {
  const { metricId: selectedMetricId } = useParams<{ metricId: string }>();
  const queryClient = useQueryClient();

  const getMetricId = useMemoizedFn((metricId?: string): string => {
    return metricId || selectedMetricId;
  });

  //UI SELECTORS

  const getMetricMemoized = useMemoizedFn(({ metricId }: { metricId?: string }): IBusterMetric => {
    const _metricId = getMetricId(metricId);
    const options = queryKeys['/metrics/get:getMetric'](_metricId);
    const data = queryClient.getQueryData(options.queryKey);
    return resolveEmptyMetric(data, _metricId);
  });

  //STATE UPDATERS

  const onInitializeMetric = useMemoizedFn((newMetric: BusterMetric) => {
    const oldMetric = getMetricMemoized({ metricId: newMetric.id });
    const upgradedMetric = upgradeMetricToIMetric(newMetric, oldMetric);
    metricUpdateConfig.onUpdateMetric(upgradedMetric, false);
  });

  // EMITTERS

  const metricShare = useShareMetric({ onInitializeMetric });

  const metricAssosciations = useUpdateMetricAssosciations({ getMetricMemoized });

  const metricUpdateConfig = useUpdateMetricConfig({
    getMetricId,
    onInitializeMetric,
    getMetricMemoized
  });

  return {
    ...metricAssosciations,
    ...metricShare,
    ...metricUpdateConfig,
    onInitializeMetric,
    getMetricMemoized
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
