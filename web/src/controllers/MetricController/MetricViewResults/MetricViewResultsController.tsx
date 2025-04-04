'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMemoizedFn, useUnmount } from '@/hooks';
import { IDataResult } from '@/api/asset_interfaces';
import { useMetricResultsLayout } from './useMetricResultsLayout';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { AppSplitterRef } from '@/components/ui/layouts';
import { AppVerticalCodeSplitter } from '@/components/features/layouts/AppVerticalCodeSplitter';
import { useMetricRunSQL } from './useMetricRunSQL';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';

const autoSaveId = 'metric-view-results';

export const MetricViewResults: React.FC<{ metricId: string }> = React.memo(({ metricId }) => {
  const appSplitterRef = React.useRef<AppSplitterRef>(null);
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );
  const containerRef = React.useRef<HTMLDivElement>(null);

  const {
    runSQL,
    resetRunSQLData,
    saveSQL,
    saveMetricError,
    runSQLError,
    isSavingMetric,
    isRunningSQL
  } = useMetricRunSQL();

  const { data: metric } = useGetMetric({ id: metricId }, ({ sql, data_source_id }) => ({
    sql,
    data_source_id
  }));
  const { data: metricData, isFetched: isFetchedInitialData } = useGetMetricData({ id: metricId });

  const [sql, setSQL] = useState(metric?.sql || '');

  const dataSourceId = metric?.data_source_id || '';
  const data: IDataResult = metricData?.dataFromRerun || metricData?.data || null;

  const disableSave = useMemo(() => {
    return !sql || isRunningSQL || sql === metric?.sql;
  }, [sql, isRunningSQL, metric?.sql]);

  const onRunQuery = useMemoizedFn(async () => {
    try {
      const res = await runSQL({
        dataSourceId,
        sql,
        metricId
      });

      if (res && res.data && res.data.length > 0) {
        const data = res.data;
        const headerHeight = 50;
        const heightOfRow = 36;
        const heightOfDataContainer = headerHeight + heightOfRow * (data.length || 0);
        const containerHeight = containerRef.current?.clientHeight || 0;
        const maxHeight = Math.floor(containerHeight * 0.6);
        const finalHeight = Math.min(heightOfDataContainer, maxHeight);
        appSplitterRef.current?.setSplitSizes(['auto', `${finalHeight}px`]);
      }
    } catch (error) {
      //
    }
  });

  const onSaveSQL = useMemoizedFn(async () => {
    await saveSQL({
      metricId,
      sql,
      dataSourceId
    });
  });

  const { defaultLayout, renderSecondary } = useMetricResultsLayout({
    selectedFileViewSecondary,
    appSplitterRef,
    autoSaveId
  });

  useEffect(() => {
    if (metric?.sql) {
      setSQL(metric.sql);
    }
  }, [metric?.sql]);

  useUnmount(() => {
    resetRunSQLData({ metricId });
  });

  return (
    <div ref={containerRef} className="h-full w-full p-5">
      <AppVerticalCodeSplitter
        ref={appSplitterRef}
        autoSaveId={autoSaveId}
        sql={sql}
        setSQL={setSQL}
        runSQLError={runSQLError || saveMetricError}
        topHidden={!renderSecondary}
        onRunQuery={onRunQuery}
        onSaveSQL={onSaveSQL}
        data={data}
        disabledSave={disableSave}
        fetchingData={isRunningSQL || isSavingMetric || !isFetchedInitialData}
        defaultLayout={defaultLayout}
      />
    </div>
  );
});

MetricViewResults.displayName = 'MetricViewResults';
