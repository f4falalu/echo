'use client';

import {
  ColumnSettings,
  DEFAULT_CHART_CONFIG,
  IColumnLabelFormat,
  type IBusterMetricChartConfig
} from '@/api/asset_interfaces/metric';
import { useUpdateMetric } from '@/api/buster_rest/metrics';
import { useMemoizedFn } from '@/hooks';
import { useGetMetricMemoized } from './useGetMetricMemoized';
import { useParams } from 'next/navigation';

export const useUpdateMetricChart = (props?: { metricId?: string }) => {
  const params = useParams<{ metricId?: string }>();
  const metricId = props?.metricId ?? params.metricId ?? '';
  const { mutate: onUpdateMetricDebounced } = useUpdateMetric();
  const getMetricMemoized = useGetMetricMemoized();

  const onUpdateMetricChartConfig = useMemoizedFn(
    ({
      chartConfig,
      ignoreUndoRedo
    }: {
      chartConfig: Partial<IBusterMetricChartConfig>;
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

      const newChartConfig: IBusterMetricChartConfig = {
        ...DEFAULT_CHART_CONFIG,
        ...currentMetric.chart_config,
        ...chartConfig
      };

      console.log(newChartConfig.yAxisScaleType);
      onUpdateMetricDebounced({
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
      columnLabelFormat: Partial<IColumnLabelFormat>;
    }) => {
      const currentMetric = getMetricMemoized(metricId);
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
        chartConfig: {
          columnLabelFormats
        }
      });
    }
  );

  const onUpdateColumnSetting = useMemoizedFn(
    ({ columnId, columnSetting }: { columnId: string; columnSetting: Partial<ColumnSettings> }) => {
      const currentMetric = getMetricMemoized(metricId);
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
        chartConfig: {
          columnSettings: newColumnSettings
        }
      });
    }
  );

  return {
    onUpdateMetricChartConfig,
    onUpdateColumnLabelFormat,
    onUpdateColumnSetting
  };
};
