import React from 'react';
import type { MetricViewProps } from '../config';
import { useBusterMetricIndividual } from '@/context/Metrics';
import { AppVerticalCodeSplitter } from '@/components/layout/AppVerticalCodeSplitter';
import { useMemoizedFn } from 'ahooks';
import { IDataResult } from '@/api/asset_interfaces';
import { useMetricLayout } from '../useMetricLayout';
import { AppSplitterRef } from '@/components';
import { useChatLayoutContextSelector } from '@/app/app/_layouts/ChatLayout';
import { timeout } from '@/utils';

const autoSaveId = 'metric-view-results';

export const MetricViewResults: React.FC<MetricViewProps> = React.memo(({ metricId }) => {
  const appSplitterRef = React.useRef<AppSplitterRef>(null);
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );

  const { metric, metricData } = useBusterMetricIndividual({ metricId });

  const sql = '';
  const data: IDataResult = metricData.dataFromRerun || metricData.data || null;

  const onRunQuery = useMemoizedFn(async () => {
    console.log('onRunQuery');
    await timeout(1000);
    return Promise.resolve();
  });

  const { defaultLayout, renderSecondary } = useMetricLayout({
    selectedFileViewSecondary,
    appSplitterRef,
    autoSaveId,
    type: 'sql'
  });

  return (
    <div className="h-full w-full p-3">
      <AppVerticalCodeSplitter
        ref={appSplitterRef}
        autoSaveId={autoSaveId}
        sql={sql}
        setSQL={() => {}}
        runSQLError={null}
        topHidden={!renderSecondary}
        onRunQuery={onRunQuery}
        data={data}
        fetchingData={false}
        defaultLayout={defaultLayout}
      />
    </div>
  );
});

MetricViewResults.displayName = 'MetricViewResults';
