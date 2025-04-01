import type { BusterMetricData, IBusterMetricChartConfig } from '@/api/asset_interfaces/metric';
import { RunSQLResponse } from '@/api/asset_interfaces/sql';
import { queryKeys } from '@/api/query_keys';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { didColumnDataChange, simplifyChatConfigForSQLChange } from './helpers';
import { useRunSQL as useRunSQLQuery } from '@/api/buster_rest';
import { useUpdateMetric } from '@/api/buster_rest/metrics';
import { useGetMetricMemoized } from '@/context/Metrics';

export const useMetricRunSQL = () => {
  const queryClient = useQueryClient();
  const getMetricMemoized = useGetMetricMemoized();
  const { mutateAsync: updateMetricMutation } = useUpdateMetric();
  const {
    mutateAsync: saveMetric,
    error: saveMetricError,
    isPending: isSavingMetric
  } = useUpdateMetric({
    updateOnSave: true,
    wait: 0
  });
  const {
    mutateAsync: runSQLMutation,
    error: runSQLError,
    isPending: isRunningSQL
  } = useRunSQLQuery();
  const { openSuccessNotification } = useBusterNotifications();

  const getDataByMetricIdMemoized = useMemoizedFn(
    (metricId: string): BusterMetricData | undefined => {
      const options = queryKeys.metricsGetData(metricId);
      return queryClient.getQueryData(options.queryKey);
    }
  );

  const originalConfigs = useRef<{
    chartConfig: IBusterMetricChartConfig;
    sql: string;
    data: BusterMetricData['data'];
    dataMetadata: BusterMetricData['data_metadata'];
  } | null>(null);

  const onSetDataForMetric = ({
    metricId,
    data,
    data_metadata,
    isDataFromRerun
  }: {
    metricId: string;
    data: BusterMetricData['data'];
    data_metadata: BusterMetricData['data_metadata'];
    isDataFromRerun: boolean;
  }) => {
    const options = queryKeys.metricsGetData(metricId);
    const currentData = getDataByMetricIdMemoized(metricId);
    const setter = isDataFromRerun ? 'dataFromRerun' : 'data';
    queryClient.setQueryData(options.queryKey, {
      ...currentData!,
      [setter]: data,
      data_metadata
    });
  };

  const onResponseRunSQL = useMemoizedFn(
    (d: RunSQLResponse, sql: string, { metricId }: { metricId?: string }) => {
      if (metricId) {
        const { data, data_metadata } = d;
        const metricMessage = getMetricMemoized(metricId);
        const currentMessageData = getDataByMetricIdMemoized(metricId);
        if (!originalConfigs.current) {
          originalConfigs.current = {
            chartConfig: metricMessage?.chart_config!,
            sql: metricMessage?.sql!,
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

        onSetDataForMetric({
          metricId,
          data,
          isDataFromRerun: true,
          data_metadata
        });
        updateMetricMutation({
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
      const result = await runSQLMutation({
        data_source_id: dataSourceId,
        sql
      });
      onResponseRunSQL(result, sql, { metricId });
      return result;
    }
  );

  const resetRunSQLData = useMemoizedFn(({ metricId }: { metricId: string }) => {
    if (!originalConfigs.current) return;
    const oldConfig = originalConfigs.current?.chartConfig;
    updateMetricMutation({
      id: metricId,
      chart_config: oldConfig
    });
    onSetDataForMetric({
      metricId,
      data: originalConfigs.current?.data!,
      data_metadata: originalConfigs.current?.dataMetadata!,
      isDataFromRerun: false
    });
    originalConfigs.current = null;
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
      const ogConfigs = originalConfigs.current;
      const currentMetric = getMetricMemoized(metricId);
      const dataSourceId = dataSourceIdProp || currentMetric?.data_source_id;

      if (!ogConfigs || ogConfigs.sql !== sql) {
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

      await saveMetric({
        id: metricId,
        sql
      });

      if (originalConfigs.current) {
        onSetDataForMetric({
          metricId,
          data: originalConfigs.current?.data!,
          data_metadata: originalConfigs.current?.dataMetadata!,
          isDataFromRerun: false
        });
      }

      setTimeout(() => {
        openSuccessNotification({
          title: 'SQL Saved',
          message: 'Your changes have been saved.'
        });
      }, 120);

      originalConfigs.current = null;
    }
  );

  return {
    runSQL,
    resetRunSQLData,
    saveSQL,
    saveMetricError: saveMetricError?.message,
    runSQLError: runSQLError?.message,
    isSavingMetric,
    isRunningSQL
  };
};
