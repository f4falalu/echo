import { useDebounceFn, useMemoizedFn } from 'ahooks';
import type { IBusterMetric } from '../interfaces';
import {
  BusterMetric,
  DEFAULT_CHART_CONFIG,
  IBusterMetricChartConfig,
  ShareRole,
  VerificationStatus
} from '@/api/asset_interfaces';
import { prepareMetricUpdateMetric } from '../helpers';
import { MetricUpdateMetric } from '@/api/buster_socket/metrics';
import { ColumnSettings, IColumnLabelFormat } from '@/components/charts';
import { useBusterWebSocket } from '../../BusterWebSocket';

export const useUpdateMetricConfig = ({
  getMetricId,
  getMetricMemoized,
  setMetrics,
  startTransition,
  onInitializeMetric
}: {
  getMetricMemoized: ({ metricId }: { metricId?: string }) => IBusterMetric;
  onInitializeMetric: (metric: BusterMetric) => void;
  getMetricId: (metricId?: string) => string;
  setMetrics: (metrics: Record<string, IBusterMetric>) => void;
  startTransition: (fn: () => void) => void;
}) => {
  const busterSocket = useBusterWebSocket();

  const onUpdateMetric = useMemoizedFn(
    async (newMetricPartial: Partial<IBusterMetric>, saveToServer: boolean = true) => {
      const metricId = getMetricId(newMetricPartial.id);
      const currentMetric = getMetricMemoized({ metricId })!;
      const newMetric: IBusterMetric = {
        ...currentMetric,
        ...newMetricPartial
      };
      setMetrics({
        [metricId]: newMetric
      });

      //This will trigger a rerender and push prepareMetricUpdateMetric off UI metric
      startTransition(() => {
        const isReadyOnly = currentMetric.permission === ShareRole.VIEWER;
        if (saveToServer && !isReadyOnly) {
          _prepareMetricAndSaveToServer(newMetric, currentMetric);
        }
      });
    }
  );

  const _onCheckUpdateMetricMessage = useMemoizedFn((metric: BusterMetric) => {
    // const newMessage = metric[0].messages.find((m) => m.id === messageId);
    // const currentMessage = getMetricMemoizedMessage({
    //   metricId: selectedMetricId,
    //   messageId: messageId
    // });

    // if (newMessage?.draft_session_id && !currentMessage?.draft_session_id) {
    //   onUpdateMetricMessage(
    //     {
    //       metricId: selectedMetricId,
    //       messageId: messageId,
    //       message: {
    //         draft_session_id: newMessage.draft_session_id
    //       }
    //     },
    //     false
    //   );
    // }
    return metric;
  });

  const updateMetricToServer = useMemoizedFn((payload: MetricUpdateMetric['payload']) => {
    return busterSocket.emitAndOnce({
      emitEvent: {
        route: '/metrics/update',
        payload
      },
      responseEvent: {
        route: '/metrics/update:updateMetricState',
        callback: _onCheckUpdateMetricMessage
      }
    });
  });

  const { run: _updateMetricToServer } = useDebounceFn(updateMetricToServer, {
    wait: 300
  });

  const { run: _prepareMetricAndSaveToServer } = useDebounceFn(
    useMemoizedFn((newMetric: IBusterMetric, oldMetric: IBusterMetric) => {
      const changedValues = prepareMetricUpdateMetric(newMetric, oldMetric);
      if (changedValues) {
        _updateMetricToServer(changedValues);
      }
    }),
    { wait: 700 }
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
    async ({
      metricId,
      ...params
    }: {
      metricId: string;
      save_draft: boolean;
      save_as_metric_state?: string;
    }) => {
      return busterSocket.emitAndOnce({
        emitEvent: {
          route: '/metrics/update',
          payload: {
            id: metricId,
            ...params
          }
        },
        responseEvent: {
          route: '/metrics/update:updateMetricState',
          callback: onInitializeMetric
        }
      }) as Promise<[BusterMetric]>;
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
    onUpdateMetric,
    onVerifiedMetric,
    onUpdateMetricChartConfig,
    onUpdateColumnLabelFormat,
    onUpdateColumnSetting,
    onSaveMetricChanges,
    updateMetricToServer
  };
};
