import { forwardRef, useMemo } from 'react';
import type { DataResult } from '@buster/server-shared/metrics';
import { AppSplitter, type AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { DataContainer } from './DataContainer';
import { SQLContainer } from './SQLContainer';
import { useMemoizedFn } from '../../../../hooks';

export interface AppVerticalCodeSplitterProps {
  sql: string;
  setSQL: (sql: string) => void;
  runSQLError: string | undefined;
  onRunQuery: () => Promise<void>;
  data: DataResult;
  fetchingData: boolean;
  defaultLayout: [string, string];
  autoSaveId: string;
  topHidden?: boolean;
  onSaveSQL?: () => Promise<void>;
  disabledSave?: boolean;
  gapAmount?: number;
  className?: string;
  readOnly?: boolean;
}

const MIN_LEFT_SIZE = 120;
const MIN_RIGHT_SIZE = 80;
const AUTO_BUST_STORAGE_ON_INIT_SIZE = 800;

export const AppVerticalCodeSplitter = forwardRef<AppSplitterRef, AppVerticalCodeSplitterProps>(
  (
    {
      sql,
      setSQL,
      runSQLError,
      onRunQuery,
      onSaveSQL,
      data,
      readOnly = false,
      fetchingData,
      defaultLayout,
      autoSaveId,
      disabledSave = false,
      topHidden = false,
      gapAmount = 3,
      className
    },
    ref
  ) => {
    //tailwind might not like this, but yolo
    const sqlContainerClassName = !topHidden ? `pb-${gapAmount}` : '';
    const dataContainerClassName = !topHidden ? `pt-${gapAmount}` : '';

    const bustStorageOnInit = useMemoizedFn(
      (preservedSideValue: number | null, refSize: number) => {
        return (
          !preservedSideValue ||
          preservedSideValue < MIN_LEFT_SIZE ||
          refSize < MIN_LEFT_SIZE + MIN_RIGHT_SIZE ||
          preservedSideValue > AUTO_BUST_STORAGE_ON_INIT_SIZE ||
          preservedSideValue > refSize - MIN_RIGHT_SIZE ||
          !refSize
        );
      }
    );

    return (
      <AppSplitter
        ref={ref}
        leftPanelClassName={sqlContainerClassName}
        leftChildren={useMemo(
          () => (
            <SQLContainer
              sql={sql}
              setDatasetSQL={setSQL}
              error={runSQLError}
              onRunQuery={onRunQuery}
              onSaveSQL={onSaveSQL}
              disabledSave={disabledSave}
              readOnly={readOnly}
            />
          ),
          [sql, setSQL, runSQLError, onRunQuery, onSaveSQL, disabledSave, readOnly]
        )}
        rightPanelClassName={dataContainerClassName}
        rightChildren={useMemo(
          () => (
            <DataContainer data={data} fetchingData={fetchingData} />
          ),
          [data, fetchingData]
        )}
        split="horizontal"
        defaultLayout={defaultLayout}
        autoSaveId={autoSaveId}
        preserveSide="left"
        rightPanelMinSize={`${MIN_RIGHT_SIZE}px`}
        leftPanelMinSize={`${MIN_LEFT_SIZE}px`}
        leftHidden={topHidden}
        className={className}
        bustStorageOnInit={bustStorageOnInit}
      />
    );
  }
);

AppVerticalCodeSplitter.displayName = 'AppVerticalCodeSplitter';
