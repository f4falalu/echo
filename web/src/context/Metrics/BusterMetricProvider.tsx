'use client';

import React, { PropsWithChildren, useTransition } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import {
  BusterMetric,
  ColumnSettings,
  DEFAULT_CHART_CONFIG,
  IColumnLabelFormat,
  type IBusterMetric,
  type IBusterMetricChartConfig
} from '@/api/asset_interfaces/metric';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';
import { useDebounceFn, useMemoizedFn } from '@/hooks';
import {
  prepareMetricUpdateMetric,
  resolveEmptyMetric,
  upgradeMetricToIMetric
} from '@/lib/metrics';
import { create } from 'mutative';
import { ShareRole, VerificationStatus } from '@/api/asset_interfaces/share';
import { useUpdateMetric } from '@/api/buster_rest/metrics';

const useBusterMetrics = () => {
  const [isPending, startTransition] = useTransition();
  const { metricId: selectedMetricId } = useParams<{ metricId: string }>();
  const { mutateAsync: updateMetricMutation } = useUpdateMetric();
  const queryClient = useQueryClient();

  const getMetricId = useMemoizedFn((metricId?: string): string => {
    return metricId || selectedMetricId;
  });

  //UI SELECTORS

  const getMetricMemoized = useMemoizedFn(({ metricId }: { metricId?: string }): IBusterMetric => {
    const _metricId = getMetricId(metricId);
    const options = queryKeys.metricsGetMetric(_metricId);
    const data = queryClient.getQueryData(options.queryKey);
    return resolveEmptyMetric(data, _metricId);
  });

  // STATE UPDATERS

  const setMetricToState = useMemoizedFn((metric: IBusterMetric) => {
    const metricId = getMetricId(metric.id);
    const options = queryKeys.metricsGetMetric(metricId);
    queryClient.setQueryData(options.queryKey, metric);
  });

  const onUpdateMetric = useMemoizedFn(
    async (newMetricPartial: Partial<IBusterMetric>, saveToServer: boolean = true) => {
      const metricId = getMetricId(newMetricPartial.id);
      const currentMetric = getMetricMemoized({ metricId });
      const newMetric = create(currentMetric, (draft) => {
        Object.assign(draft, newMetricPartial);
      });
      setMetricToState(newMetric);
      //This will trigger a rerender and push prepareMetricUpdateMetric off UI metric
      startTransition(() => {
        const isReadyOnly = currentMetric.permission === ShareRole.VIEWER;
        if (saveToServer && !isReadyOnly) {
          _prepareMetricAndSaveToServer(newMetric, currentMetric);
        }
      });
      return newMetric;
    }
  );

  const { run: _prepareMetricAndSaveToServer } = useDebounceFn(
    useMemoizedFn((newMetric: IBusterMetric, oldMetric: IBusterMetric) => {
      const changedValues = prepareMetricUpdateMetric(newMetric, oldMetric);
      if (changedValues) {
        updateMetricMutation(changedValues);
      }
    }),
    { wait: 750 }
  );

  const onUpdateMetricChartConfig = useMemoizedFn(
    ({
      metricId,
      chartConfig,
      ignoreUndoRedo
    }: {
      metricId?: string;
      chartConfig: Partial<IBusterMetricChartConfig>;
      ignoreUndoRedo?: boolean;
    }) => {
      const currentMetric = getMetricMemoized({
        metricId
      });

      if (!ignoreUndoRedo) {
        // undoRedoParams.addToUndoStack({
        //   metricId: editMetric.id,
        //   messageId: editMessage.id,
        //   chartConfig: editMessage.chart_config
        // });
      }

      const newChartConfig: IBusterMetricChartConfig = {
        ...DEFAULT_CHART_CONFIG,
        ...currentMetric.chart_config,
        ...chartConfig
      };
      onUpdateMetric({
        id: metricId,
        chart_config: newChartConfig
      });
    }
  );

  const onUpdateColumnLabelFormat = useMemoizedFn(
    ({
      columnId,
      columnLabelFormat,
      metricId
    }: {
      columnId: string;
      metricId?: string;
      columnLabelFormat: Partial<IColumnLabelFormat>;
    }) => {
      const currentMetric = getMetricMemoized({ metricId });
      const existingColumnLabelFormats = currentMetric.chart_config.columnLabelFormats;
      const existingColumnLabelFormat = existingColumnLabelFormats[columnId];
      const newColumnLabelFormat = {
        ...existingColumnLabelFormat,
        ...columnLabelFormat
      };
      const columnLabelFormats = {
        ...existingColumnLabelFormats,
        [columnId]: newColumnLabelFormat
      };
      onUpdateMetricChartConfig({
        metricId,
        chartConfig: {
          columnLabelFormats
        }
      });
    }
  );

  const onUpdateColumnSetting = useMemoizedFn(
    ({
      columnId,
      columnSetting,
      metricId
    }: {
      columnId: string;
      columnSetting: Partial<ColumnSettings>;
      metricId?: string;
    }) => {
      const currentMetric = getMetricMemoized({ metricId });
      const existingColumnSettings = currentMetric.chart_config.columnSettings;
      const existingColumnSetting = currentMetric.chart_config.columnSettings[columnId];
      const newColumnSetting: Required<ColumnSettings> = {
        ...existingColumnSetting,
        ...columnSetting
      };
      const newColumnSettings: Record<string, Required<ColumnSettings>> = {
        ...existingColumnSettings,
        [columnId]: newColumnSetting
      };
      onUpdateMetricChartConfig({
        metricId,
        chartConfig: {
          columnSettings: newColumnSettings
        }
      });
    }
  );

  const onSaveMetricChanges = useMemoizedFn(
    async (params: { metricId: string; save_draft: boolean; save_as_metric_state?: string }) => {
      return updateMetricMutation({
        id: params.metricId,
        ...params
      });
    }
  );

  const onVerifiedMetric = useMemoizedFn(
    async ({ metricId, status }: { metricId: string; status: VerificationStatus }) => {
      return await onUpdateMetric({
        id: metricId,
        status
      });
    }
  );

  return {
    getMetricMemoized,
    onUpdateMetric,
    onUpdateMetricChartConfig,
    onUpdateColumnLabelFormat,
    onUpdateColumnSetting,
    onSaveMetricChanges,
    onVerifiedMetric
  };
};

const BusterMetrics = createContext<ReturnType<typeof useBusterMetrics>>(
  {} as ReturnType<typeof useBusterMetrics>
);

export const BusterMetricsProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  return <BusterMetrics.Provider value={useBusterMetrics()}>{children}</BusterMetrics.Provider>;
});
BusterMetricsProvider.displayName = 'BusterMetricsProvider';

export const useBusterMetricsContextSelector = <T,>(
  selector: (state: ReturnType<typeof useBusterMetrics>) => T
) => {
  return useContextSelector(BusterMetrics, selector);
};
