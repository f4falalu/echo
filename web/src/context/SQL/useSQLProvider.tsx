import React, { useRef, useState } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import { BusterMetricData, useBusterMetricsContextSelector } from '../Metrics';
import {
  createContext,
  useContextSelector,
  ContextSelector
} from '@fluentui/react-context-selector';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { useBusterMetricDataContextSelector } from '../MetricData';
import { useBusterNotifications } from '../BusterNotifications';
import { didColumnDataChange, simplifyChratConfigForSQLChange } from './helpers';
import { timeout } from '@/utils';
import type { RunSQLResponse } from '@/api/asset_interfaces';
import { MetricUpdateMetric } from '@/api/buster_socket/metrics';

export const useSQLProvider = () => {
  const busterSocket = useBusterWebSocket();
  const { openSuccessNotification } = useBusterNotifications();
  const onUpdateMetric = useBusterMetricsContextSelector((x) => x.onUpdateMetric);
  const onSetMetricData = useBusterMetricDataContextSelector((x) => x.onSetMetricData);
  const getAllMetricDataMemoized = useBusterMetricDataContextSelector(
    (x) => x.getAllMetricDataMemoized
  );
  const updateMetricMessageToServer = useBusterMetricsContextSelector(
    (x) => x.updateMetricMessageToServer
  );
  const getMetric = useBusterMetricsContextSelector((x) => x.getMetricMemoized);
  const onSaveMetricChanges = useBusterMetricsContextSelector((x) => x.onSaveMetricChanges);

  const [warnBeforeNavigating, setWarnBeforeNavigating] = useState(false);

  const [resetTrigger, setResetTrigger] = useState<number>(0); //this is used to reset the original configs when the metric is reset. It's a hack used in useDisableSaveChanges.tsx

  const originalConfigs = useRef<
    Record<
      string,
      {
        chartConfig: IBusterMetricChartConfig;
        code: string;
        data: BusterMetricData['data'];
        dataMetadata: BusterMetricData['data_metadata'];
      }
    >
  >({});

  const _onResponseRunSQL = useMemoizedFn(
    (d: RunSQLResponse, sql: string, { metricId }: { metricId?: string }) => {
      if (metricId) {
        const { data, data_metadata } = d;
        const metricMessage = getMetric({ metricId });
        const currentMessageData = getAllMetricDataMemoized(metricId);
        if (!originalConfigs.current[metricId]) {
          originalConfigs.current[metricId] = {
            chartConfig: metricMessage?.chart_config!,
            code: currentMessageData?.code!,
            data: currentMessageData?.data!,
            dataMetadata: currentMessageData?.data_metadata!
          };
        }

        const oldColumnData = metricMessage.data_metadata?.column_metadata;
        const newColumnData = data_metadata?.column_metadata;

        const didDataMetadataChange = didColumnDataChange(oldColumnData, newColumnData);

        const totallyDefaultChartConfig: IBusterMetricChartConfig = didDataMetadataChange
          ? simplifyChratConfigForSQLChange(metricMessage.chart_config, data_metadata)
          : metricMessage.chart_config;

        onSetMetricData({
          metricId,
          data,
          isDataFromRerun: true,
          data_metadata,
          code: sql
        });
        onUpdateMetric({
          id: metricId,
          chart_config: totallyDefaultChartConfig
        });
      }

      return d;
    }
  );

  const runSQL = useMemoizedFn(
    async ({ datasetId, sql, metricId }: { datasetId: string; metricId?: string; sql: string }) => {
      return new Promise<RunSQLResponse>((resolve, reject) => {
        busterSocket.emitAndOnce({
          emitEvent: {
            route: '/sql/run',
            payload: {
              dataset_id: datasetId,
              sql
            }
          },
          responseEvent: {
            route: '/sql/run:runSql',
            callback: (d) => {
              const res = _onResponseRunSQL(d, sql, { metricId });
              resolve(res);
            },
            onError: reject
          }
        });
      });
    }
  );

  const resetRunSQLData = useMemoizedFn(({ metricId }: { metricId: string }) => {
    setWarnBeforeNavigating(false);

    if (!originalConfigs.current[metricId]) return;
    const oldConfig = originalConfigs.current[metricId]?.chartConfig;
    onUpdateMetric({
      id: metricId,
      chart_config: oldConfig
    });
    onSetMetricData({
      metricId,
      data: originalConfigs.current[metricId]?.data!,
      data_metadata: originalConfigs.current[metricId]?.dataMetadata!,
      code: originalConfigs.current[metricId]?.code!,
      isDataFromRerun: false
    });
    delete originalConfigs.current[metricId];
  });

  const saveSQL = useMemoizedFn(async ({ metricId, sql }: { metricId: string; sql: string }) => {
    const ogConfigs = originalConfigs.current[metricId];
    const currentMessage = getMetric({ metricId });
    const datasetId = currentMessage?.dataset_id!;

    if (!ogConfigs || ogConfigs.code !== sql) {
      try {
        await runSQL({
          metricId,
          sql: sql,
          datasetId
        });
        await timeout(700);
      } catch (error) {
        throw error;
      }
    }

    const payload: MetricUpdateMetric['payload'] = {
      id: metricId,
      sql: sql
    };

    const res = await updateMetricMessageToServer(payload);
    const metricRes = await onSaveMetricChanges({
      metricId,
      save_draft: true,
      save_as_metric_state: metricId
    });

    setWarnBeforeNavigating(false);

    if (originalConfigs.current[metricId]) {
      onSetMetricData({
        metricId,
        data: originalConfigs.current[metricId]?.data!,
        data_metadata: originalConfigs.current[metricId]?.dataMetadata!,
        code: originalConfigs.current[metricId]?.code!,
        isDataFromRerun: false
      });
    }
    setResetTrigger((prev) => prev + 1);

    setTimeout(() => {
      openSuccessNotification({
        title: 'SQL Saved',
        message: 'Your changes have been saved.'
      });
    }, 120);

    delete originalConfigs.current[metricId];
  });

  return {
    runSQL,
    resetRunSQLData,
    warnBeforeNavigating,
    setWarnBeforeNavigating,
    saveSQL,
    resetTrigger
  };
};

const BusterSQL = createContext<ReturnType<typeof useSQLProvider>>(
  {} as ReturnType<typeof useSQLProvider>
);

export const BusterSQLProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <BusterSQL.Provider value={useSQLProvider()}>{children}</BusterSQL.Provider>;
};

export const useSQLContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useSQLProvider>, T>
) => useContextSelector(BusterSQL, selector);
