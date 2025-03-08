import { useMemoizedFn, useDebounceFn } from '@/hooks';
import type {
  IBusterMetric,
  BusterMetric,
  ColumnSettings,
  IBusterMetricChartConfig,
  IColumnLabelFormat
} from '@/api/asset_interfaces/metric';
import { DEFAULT_CHART_CONFIG } from '@/api/asset_interfaces/metric/defaults';
import { ShareRole, VerificationStatus } from '@/api/asset_interfaces/share';
import { prepareMetricUpdateMetric, upgradeMetricToIMetric } from '../helpers';
import { useTransition } from 'react';
import { queryKeys } from '@/api/query_keys';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketQueryMutation } from '@/api/buster_socket_query';

export const useUpdateMetricConfig = ({
  getMetricId,
  getMetricMemoized
}: {
  getMetricMemoized: ({ metricId }: { metricId?: string }) => IBusterMetric;
  getMetricId: (metricId?: string) => string;
}) => {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const setMetricToState = useMemoizedFn((metric: IBusterMetric) => {
    const metricId = getMetricId(metric.id);
    const options = queryKeys.metricsGetMetric(metricId);
    queryClient.setQueryData(options.queryKey, metric);
  });

  const onUpdateMetric = useMemoizedFn(
    async (newMetricPartial: Partial<IBusterMetric>, saveToServer: boolean = true) => {
      const metricId = getMetricId(newMetricPartial.id);
      const currentMetric = getMetricMemoized({ metricId })!;
      const newMetric: IBusterMetric = {
        ...currentMetric,
        ...newMetricPartial
      };
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

  const { mutateAsync: updateMetricMutation } = useSocketQueryMutation({
    emitEvent: '/metrics/update',
    responseEvent: '/metrics/update:updateMetricState',
    callback: (metric, currentData, variables) => {
      const draftSessionId = metric.draft_session_id;
      const currentMessage = getMetricMemoized({ metricId: metric.id });
      if (draftSessionId && !currentMessage?.draft_session_id) {
        onUpdateMetric(
          {
            id: metric.id,
            draft_session_id: draftSessionId
          },
          false
        );
      }
      return metric;
    }
  });

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

  const onInitializeMetric = useMemoizedFn((newMetric: BusterMetric) => {
    const oldMetric = getMetricMemoized({ metricId: newMetric.id });
    const upgradedMetric = upgradeMetricToIMetric(newMetric, oldMetric);
    onUpdateMetric(upgradedMetric, false);
  });

  return {
    onUpdateMetric,
    onVerifiedMetric,
    onUpdateMetricChartConfig,
    onUpdateColumnLabelFormat,
    onUpdateColumnSetting,
    onSaveMetricChanges,
    onInitializeMetric,
    updateMetricMutation
  };
};
