import {
  ColumnSettings,
  DEFAULT_CHART_CONFIG,
  IColumnLabelFormat,
  type IBusterMetric,
  type IBusterMetricChartConfig
} from '@/api/asset_interfaces/metric';
import { useUpdateMetric } from '@/api/buster_rest/metrics';
import { queryKeys } from '@/api/query_keys';
import { useMemoizedFn } from '@/hooks';
import { resolveEmptyMetric } from '@/lib/metrics/resolve';
import { useQueryClient } from '@tanstack/react-query';

export const useUpdateMetricChart = ({ metricId }: { metricId: string }) => {
  const queryClient = useQueryClient();
  const { mutateDebounced: onUpdateMetricDebounced } = useUpdateMetric({ wait: 600 });

  const getMetricMemoized = useMemoizedFn((metricIdProp?: string): IBusterMetric => {
    const options = queryKeys.metricsGetMetric(metricIdProp || metricId);
    const data = queryClient.getQueryData(options.queryKey);
    return resolveEmptyMetric(data, metricIdProp || metricId);
  });

  const onUpdateMetricChartConfig = useMemoizedFn(
    ({
      chartConfig,
      ignoreUndoRedo
    }: {
      chartConfig: Partial<IBusterMetricChartConfig>;
      ignoreUndoRedo?: boolean;
    }) => {
      const currentMetric = getMetricMemoized();

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
      const currentMetric = getMetricMemoized();
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
      const currentMetric = getMetricMemoized();
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
