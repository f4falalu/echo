import React, { useRef, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { BusterMetricData, useBusterMetricsContextSelector } from '../Metrics';
import {
  createContext,
  useContextSelector,
  ContextSelector
} from '@fluentui/react-context-selector';
import { useBusterMetricDataContextSelector } from '../MetricData';
import { useBusterNotifications } from '../BusterNotifications';
import { didColumnDataChange, simplifyChatConfigForSQLChange } from './helpers';
import { timeout } from '@/utils';
import type { IBusterMetricChartConfig, RunSQLResponse } from '@/api/asset_interfaces';
import { MetricUpdateMetric } from '@/api/buster_socket/metrics';
import { runSQL as runSQLRest } from '@/api/buster_rest';

export const useSQLProvider = () => {
  const { openSuccessNotification } = useBusterNotifications();
  const onUpdateMetric = useBusterMetricsContextSelector((x) => x.onUpdateMetric);
  const onSetMetricData = useBusterMetricDataContextSelector((x) => x.onSetMetricData);
  const getAllMetricDataMemoized = useBusterMetricDataContextSelector(
    (x) => x.getAllMetricDataMemoized
  );
  const updateMetricToServer = useBusterMetricsContextSelector((x) => x.updateMetricToServer);
  const getMetric = useBusterMetricsContextSelector((x) => x.getMetricMemoized);
  const onSaveMetricChanges = useBusterMetricsContextSelector((x) => x.onSaveMetricChanges);

  const [warnBeforeNavigating, setWarnBeforeNavigating] = useState(false);

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
          ? simplifyChatConfigForSQLChange(metricMessage.chart_config, data_metadata)
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
    async ({
      dataSourceId,
      sql,
      metricId
    }: {
      dataSourceId: string;
      metricId?: string;
      sql: string;
    }) => {
      try {
        const result = await runSQLRest({
          data_source_id: dataSourceId,
          sql
        });

        _onResponseRunSQL(result, sql, { metricId });

        return result;
      } catch (error) {
        //
      }
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

  const saveSQL = useMemoizedFn(
    async ({
      metricId,
      sql,
      dataSourceId: dataSourceIdProp
    }: {
      metricId: string;
      sql: string;
      dataSourceId?: string;
    }) => {
      const ogConfigs = originalConfigs.current[metricId];
      const currentMetric = getMetric({ metricId });
      const dataSourceId = dataSourceIdProp || currentMetric?.data_source_id;

      if ((!ogConfigs || ogConfigs.code !== sql) && dataSourceId) {
        try {
          await runSQL({
            metricId,
            sql: sql,
            dataSourceId
          });
        } catch (error) {
          throw error;
        }
      }

      const payload: MetricUpdateMetric['payload'] = {
        id: metricId,
        sql: sql
      };

      const res = await updateMetricToServer(payload);
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

      setTimeout(() => {
        openSuccessNotification({
          title: 'SQL Saved',
          message: 'Your changes have been saved.'
        });
      }, 120);

      delete originalConfigs.current[metricId];
    }
  );

  return {
    runSQL,
    resetRunSQLData,
    warnBeforeNavigating,
    setWarnBeforeNavigating,
    saveSQL
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
