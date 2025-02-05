import React, { forwardRef } from 'react';
import { AppSplitter, type AppSplitterRef } from '../AppSplitter';
import { SQLContainer } from './SQLContainer';
import { DataContainer } from './DataContainer';
import type { IDataResult } from '@/api/asset_interfaces';

interface AppVerticalCodeSplitterProps {
  sql: string;
  setSQL: (sql: string) => void;
  runSQLError: string | null;
  onRunQuery: () => Promise<void>;
  data: IDataResult;
  fetchingData: boolean;
  defaultLayout: [string, string];
  autoSaveId: string;
  topHidden?: boolean;
}

export const AppVerticalCodeSplitter = forwardRef<AppSplitterRef, AppVerticalCodeSplitterProps>(
  (
    {
      sql,
      setSQL,
      runSQLError,
      onRunQuery,
      data,
      fetchingData,
      defaultLayout,
      autoSaveId,
      topHidden = false
    },
    ref
  ) => {
    const sqlContainerClassName = !topHidden ? 'mb-3' : '';
    const dataContainerClassName = !topHidden ? 'mt-3' : '';

    return (
      <AppSplitter
        ref={ref}
        leftChildren={
          <SQLContainer
            className={sqlContainerClassName}
            datasetSQL={sql}
            setDatasetSQL={setSQL}
            error={runSQLError}
            onRunQuery={onRunQuery}
          />
        }
        rightChildren={
          <DataContainer
            className={dataContainerClassName}
            data={data}
            fetchingData={fetchingData}
          />
        }
        split="horizontal"
        defaultLayout={defaultLayout}
        autoSaveId={autoSaveId}
        preserveSide="left"
        rightPanelMinSize={'80px'}
        leftPanelMinSize={'120px'}
        leftHidden={topHidden}
      />
    );
  }
);

AppVerticalCodeSplitter.displayName = 'AppVerticalCodeSplitter';
