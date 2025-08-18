'use client';

import {
  type ChartConfigProps,
  type ColumnLabelFormat,
  type ColumnSettings,
  DEFAULT_CHART_CONFIG,
  DEFAULT_COLUMN_LABEL_FORMAT,
} from '@buster/server-shared/metrics';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { useUpdateMetric } from '@/api/buster_rest/metrics';
import { useGetMetricMemoized } from '@/api/buster_rest/metrics/metricQueryHelpers';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { timeout } from '@/lib/timeout';
import { getOriginalMetric, setOriginalMetric } from './useOriginalMetricStore';

export const useUpdateMetricChart = (props?: { metricId: string; chatId?: string }) => {
  const { chatId: chatIdParam, metricId: metricIdParam } = useParams({ strict: false }) as {
    chatId: string | undefined;
    metricId: string | undefined;
  };
  const metricId = props?.metricId || metricIdParam || '';
  const chatId = props?.chatId || chatIdParam || '';
  const [isSaving, setIsSaving] = useState(false);
  const { mutate: onUpdateMetric } = useUpdateMetric({
    updateVersion: false,
    updateOnSave: false,
    saveToServer: false,
  });
  const { mutateAsync: saveMetricToServer } = useUpdateMetric({
    updateOnSave: true,
    saveToServer: true,
    updateVersion: !chatId,
  });

  const getMetricMemoized = useGetMetricMemoized();

  const onUpdateMetricChartConfig = useMemoizedFn(
    ({
      chartConfig,
      ignoreUndoRedo,
    }: {
      chartConfig: Partial<ChartConfigProps>;
      ignoreUndoRedo?: boolean;
    }) => {
      const currentMetric = getMetricMemoized(metricId);

      if (!ignoreUndoRedo) {
        // undoRedoParams.addToUndoStack({
        //   metricId: editMetric.id,
        //   messageId: editMessage.id,
        //   chartConfig: editMessage.chart_config
        // });
      }

      const newChartConfig: ChartConfigProps = {
        ...DEFAULT_CHART_CONFIG,
        ...currentMetric.chart_config,
        ...chartConfig,
      };

      onUpdateMetric({
        id: metricId,
        chart_config: newChartConfig,
      });
    }
  );

  const onUpdateColumnLabelFormat = useMemoizedFn(
    ({
      columnId,
      columnLabelFormat,
    }: {
      columnId: string;
      columnLabelFormat: Partial<ColumnLabelFormat>;
    }) => {
      const currentMetric = getMetricMemoized(metricId);
      const existingColumnLabelFormats: Record<string, ColumnLabelFormat> =
        currentMetric.chart_config.columnLabelFormats;
      const existingColumnLabelFormat = existingColumnLabelFormats[columnId];
      const newColumnLabelFormat: ColumnLabelFormat = {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        ...existingColumnLabelFormat,
        ...columnLabelFormat,
      };
      const columnLabelFormats: Record<string, ColumnLabelFormat> = {
        ...existingColumnLabelFormats,
        [columnId]: newColumnLabelFormat,
      };
      onUpdateMetricChartConfig({
        chartConfig: {
          columnLabelFormats,
        },
      });
    }
  );

  const onUpdateColumnSetting = useMemoizedFn(
    ({ columnId, columnSetting }: { columnId: string; columnSetting: Partial<ColumnSettings> }) => {
      const currentMetric = getMetricMemoized(metricId);
      const existingColumnSettings: Record<string, ColumnSettings> =
        currentMetric.chart_config.columnSettings;

      const existingColumnSetting = currentMetric.chart_config.columnSettings[columnId];
      const newColumnSetting: Required<ColumnSettings> = {
        ...existingColumnSetting,
        ...columnSetting,
      };
      const newColumnSettings: Record<string, Required<ColumnSettings>> = {
        ...existingColumnSettings,
        [columnId]: newColumnSetting,
      };
      onUpdateMetricChartConfig({
        chartConfig: {
          columnSettings: newColumnSettings,
        },
      });
    }
  );

  const onUpdateMetricName = useMemoizedFn(({ name }: { name?: string }) => {
    onUpdateMetric({
      id: metricId,
      name,
    });
  });

  const onSaveMetricToServer = useMemoizedFn(async () => {
    setIsSaving(true);
    const currentMetric = getMetricMemoized(metricId);
    if (currentMetric) await saveMetricToServer(currentMetric);
    await timeout(350);
    setIsSaving(false);
  });

  const onInitializeTableColumnWidths = useMemoizedFn(
    (tableColumnWidths: ChartConfigProps['tableColumnWidths']) => {
      const originalMetric = getOriginalMetric(metricId);
      if (originalMetric) {
        const newChartConfig: ChartConfigProps = {
          ...DEFAULT_CHART_CONFIG,
          ...originalMetric.chart_config,
          tableColumnWidths,
        };

        setOriginalMetric({
          ...originalMetric,
          chart_config: newChartConfig,
        });
      }
    }
  );

  return {
    onSaveMetricToServer,
    onUpdateMetricChartConfig,
    onUpdateColumnLabelFormat,
    onUpdateColumnSetting,
    onUpdateMetricName,
    onInitializeTableColumnWidths,
    isSaving,
  };
};
