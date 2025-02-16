import React, { useEffect, useMemo } from 'react';
import type { MetricViewProps } from '../config';
import { useMetricIndividual } from '@/context/Metrics';
import { AppVerticalCodeSplitter } from '@/components/layout/AppVerticalCodeSplitter';
import { useMemoizedFn, useUnmount } from 'ahooks';
import { IDataResult } from '@/api/asset_interfaces';
import { useMetricLayout } from '../useMetricLayout';
import { AppSplitterRef } from '@/components';
import { useChatLayoutContextSelector } from '@/app/app/_layouts/ChatLayout';
import { useSQLContextSelector } from '@/context/SQL';

const autoSaveId = 'metric-view-results';

export const MetricViewResults: React.FC<MetricViewProps> = React.memo(({ metricId }) => {
  const appSplitterRef = React.useRef<AppSplitterRef>(null);
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );
  const containerRef = React.useRef<HTMLDivElement>(null);
  const runSQL = useSQLContextSelector((x) => x.runSQL);
  const resetRunSQLData = useSQLContextSelector((x) => x.resetRunSQLData);
  const saveSQL = useSQLContextSelector((x) => x.saveSQL);

  const { metric, metricData } = useMetricIndividual({ metricId });

  const [sql, setSQL] = React.useState(metric.code || '');
  const [fetchingData, setFetchingData] = React.useState(false);

  const dataSourceId = metric?.data_source_id;
  const data: IDataResult = metricData?.dataFromRerun || metricData?.data || null;

  const disableSave = useMemo(() => {
    return !sql || fetchingData || sql === metric.code;
  }, [sql, fetchingData, metric.code]);

  const onRunQuery = useMemoizedFn(async () => {
    setFetchingData(true);
    const res = await runSQL({
      dataSourceId,
      sql,
      metricId
    });

    if (res) {
      if (data && data.length > 0) {
        const headerHeight = 50;
        const heightOfRow = 36;
        const heightOfDataContainer = headerHeight + heightOfRow * (data.length || 0);
        const containerHeight = containerRef.current?.clientHeight || 0;
        const maxHeight = Math.floor(containerHeight * 0.6);
        const finalHeight = Math.min(heightOfDataContainer, maxHeight);
        appSplitterRef.current?.setSplitSizes(['auto', `${finalHeight}px`]);
      }
    }
    setFetchingData(false);
  });

  const onSaveSQL = useMemoizedFn(async () => {
    await saveSQL({
      metricId,
      sql,
      dataSourceId
    });
  });

  const { defaultLayout, renderSecondary } = useMetricLayout({
    selectedFileViewSecondary,
    appSplitterRef,
    autoSaveId,
    type: 'sql'
  });

  useEffect(() => {
    if (metric.code) {
      setSQL(metric.code);
    }
  }, [metric.code]);

  useUnmount(() => {
    resetRunSQLData({ metricId });
  });

  return (
    <div ref={containerRef} className="h-full w-full p-3">
      <AppVerticalCodeSplitter
        ref={appSplitterRef}
        autoSaveId={autoSaveId}
        sql={sql}
        setSQL={setSQL}
        runSQLError={null}
        topHidden={!renderSecondary}
        onRunQuery={onRunQuery}
        onSaveSQL={onSaveSQL}
        data={data}
        disabledSave={disableSave}
        fetchingData={fetchingData}
        defaultLayout={defaultLayout}
      />
    </div>
  );
});

MetricViewResults.displayName = 'MetricViewResults';
