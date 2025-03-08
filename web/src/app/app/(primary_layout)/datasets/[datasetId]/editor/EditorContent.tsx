'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useMemoizedFn, useRequest } from '@/hooks';
import type { IDataResult } from '@/api/asset_interfaces';
import { EditorApps, EditorContainerSubHeader } from './EditorContainerSubHeader';
import { MetadataContainer } from './MetadataContainer';
import { runSQL } from '@/api/buster_rest';
import type { RustApiError } from '@/api/buster_rest/errors';
import isEmpty from 'lodash/isEmpty';
import type { AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { useDatasetPageContextSelector } from '../_DatasetsLayout/DatasetPageContext';
import { AppVerticalCodeSplitter } from '@/components/features/layouts/AppVerticalCodeSplitter';
import { cn } from '@/lib/classMerge';

export const EditorContent: React.FC<{
  defaultLayout: [string, string];
}> = ({ defaultLayout }) => {
  const ref = useRef<HTMLDivElement>(null);
  const splitterRef = useRef<AppSplitterRef>(null);
  const [selectedApp, setSelectedApp] = useState<EditorApps>(EditorApps.PREVIEW);
  const datasetData = useDatasetPageContextSelector((state) => state.datasetData);
  const { data: dataset } = useDatasetPageContextSelector((state) => state.dataset);
  const sql = useDatasetPageContextSelector((state) => state.sql);
  const setSQL = useDatasetPageContextSelector((state) => state.setSQL);
  const ymlFile = useDatasetPageContextSelector((state) => state.ymlFile);
  const setYmlFile = useDatasetPageContextSelector((state) => state.setYmlFile);

  const [tempData, setTempData] = useState<IDataResult>(datasetData.data || []);
  const [runSQLError, setRunSQLError] = useState<string>('');

  const shownData = useMemo(() => {
    return isEmpty(tempData) ? datasetData.data || [] : tempData;
  }, [tempData, datasetData.data]);

  const { runAsync: runQuery, loading: fetchingTempData } = useRequest(
    async () => {
      try {
        setRunSQLError('');
        const res = await runSQL({ data_source_id: dataset?.data_source_id!, sql });
        const data = res.data;
        setTempData(data);
        return data;
      } catch (error) {
        setRunSQLError((error as unknown as RustApiError)?.message || 'Something went wrong');
      }
    },
    { manual: true }
  );

  const fetchingInitialData = datasetData.isFetching;

  const onRunQuery = useMemoizedFn(async () => {
    try {
      const result = await runQuery();
      if (result && result.length > 0) {
        const headerHeight = 50;
        const heightOfRow = 36;
        const heightOfDataContainer = headerHeight + heightOfRow * (result.length || 0);
        const containerHeight = ref.current?.clientHeight || 0;
        const maxHeight = Math.floor(containerHeight * 0.6);
        const finalHeight = Math.min(heightOfDataContainer, maxHeight);
        splitterRef.current?.setSplitSizes(['auto', `${finalHeight}px`]);
      }
    } catch (error) {
      //
    }
  });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" ref={ref}>
      <EditorContainerSubHeader selectedApp={selectedApp} setSelectedApp={setSelectedApp} />
      <div className={cn('h-full w-full overflow-hidden p-5', 'bg-item-hover')}>
        {selectedApp === EditorApps.PREVIEW && (
          <AppVerticalCodeSplitter
            autoSaveId="dataset-editor"
            ref={splitterRef}
            sql={sql}
            setSQL={setSQL}
            runSQLError={runSQLError}
            onRunQuery={onRunQuery}
            data={shownData}
            fetchingData={fetchingInitialData || fetchingTempData}
            defaultLayout={defaultLayout}
          />
        )}

        {selectedApp === EditorApps.METADATA && (
          <MetadataContainer ymlFile={ymlFile} setYmlFile={setYmlFile} />
        )}
      </div>
    </div>
  );
};
