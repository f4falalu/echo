'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useUpdateMetric } from '@/api/buster_rest/metrics';
import { useMemoizedFn } from '@/hooks';
import { timeout } from '@/lib/timeout';
import { useGetMetricMemoized } from './useGetMetricMemoized';
import { useOriginalMetricStore } from './useOriginalMetricStore';
import {
  DEFAULT_CHART_CONFIG,
  DEFAULT_COLUMN_LABEL_FORMAT,
  type ChartConfigProps,
  type ColumnLabelFormat,
  type ColumnSettings
} from '@buster/server-shared/metrics';

export const useUpdateMetricChart = (props?: { metricId?: string; chatId?: string }) => {
  const params = useParams<{ metricId?: string; chatId?: string }>();
  const metricId = props?.metricId ?? params.metricId ?? '';
  const chatId = props?.chatId ?? params.chatId ?? '';
  const [isSaving, setIsSaving] = useState(false);
  const getOriginalMetric = useOriginalMetricStore((x) => x.getOriginalMetric);
  const setOriginalMetric = useOriginalMetricStore((x) => x.setOriginalMetric);
  const { mutate: onUpdateMetric } = useUpdateMetric({
    updateVersion: false,
    updateOnSave: false,
    saveToServer: false
  });
  const { mutateAsync: saveMetricToServer } = useUpdateMetric({
    updateOnSave: true,
    saveToServer: true,
    updateVersion: !chatId
  });

  const getMetricMemoized = useGetMetricMemoized();

  const onUpdateMetricChartConfig = useMemoizedFn(
    ({
      chartConfig,
      ignoreUndoRedo
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
      columnLabelFormat
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
        ...columnLabelFormat
      };
      const columnLabelFormats: Record<string, ColumnLabelFormat> = {
        ...existingColumnLabelFormats,
        [columnId]: newColumnLabelFormat
      };
      onUpdateMetricChartConfig({
        chartConfig: {
          columnLabelFormats
        }
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
        ...columnSetting
      };
      const newColumnSettings: Record<string, Required<ColumnSettings>> = {
        ...existingColumnSettings,
        [columnId]: newColumnSetting
      };
      onUpdateMetricChartConfig({
        chartConfig: {
          columnSettings: newColumnSettings
        }
      });
    }
  );

  const onUpdateMetricName = useMemoizedFn(({ name }: { name?: string }) => {
    onUpdateMetric({
      id: metricId,
      name
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
          tableColumnWidths
        };

        setOriginalMetric({
          ...originalMetric,
          chart_config: newChartConfig
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
    isSaving
  };
};
