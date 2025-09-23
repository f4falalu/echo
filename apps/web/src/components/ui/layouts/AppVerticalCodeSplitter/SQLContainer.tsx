import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { FileCard } from '@/components/ui/card/FileCard';
import { ErrorClosableContainer } from '@/components/ui/error/ErrorClosableContainer';
import { Command, ReturnKey } from '@/components/ui/icons';
import { AppCodeEditor } from '@/components/ui/inputs/AppCodeEditor';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { AppTooltip } from '../../tooltip';
import type { AppVerticalCodeSplitterProps } from './AppVerticalCodeSplitter';

export const SQLContainer: React.FC<{
  className?: string;
  sql: string | undefined;
  setDatasetSQL: (sql: string) => void;
  error?: string | null;
  readOnly?: boolean;
  saveButton?: AppVerticalCodeSplitterProps['saveButton'];
  runButton?: AppVerticalCodeSplitterProps['runButton'];
}> = React.memo(
  ({ className = '', saveButton, readOnly = false, sql, setDatasetSQL, runButton, error }) => {
    const { openInfoMessage } = useBusterNotifications();

    const onCopySQL = () => {
      navigator.clipboard.writeText(sql || '');
      openInfoMessage('SQL copied to clipboard');
    };

    const memoizedFooter = useMemo(() => {
      return (
        <>
          <Button onClick={onCopySQL}>Copy SQL</Button>

          <div className="flex items-center gap-2">
            {saveButton && !readOnly && (
              <AppTooltip title={saveButton.tooltip} delayDuration={500}>
                <Button
                  disabled={saveButton?.disabled || !sql}
                  variant="black"
                  loading={saveButton?.loading}
                  onClick={saveButton?.onClick}
                  prefix={saveButton.icon}
                >
                  {saveButton.label || 'Save'}
                </Button>
              </AppTooltip>
            )}

            {!readOnly && runButton && (
              <Button
                variant="default"
                loading={runButton?.loading}
                disabled={!sql}
                className="flex items-center space-x-0"
                onClick={runButton?.onClick}
                suffix={
                  runButton?.suffix || (
                    <div className="flex items-center gap-x-1 text-sm">
                      <Command />
                      <ReturnKey />
                    </div>
                  )
                }
              >
                Run
              </Button>
            )}
          </div>
        </>
      );
    }, [saveButton, runButton, sql]);

    return (
      <FileCard
        className={className}
        footerClassName="flex justify-between file-card space-x-4"
        footer={memoizedFooter}
      >
        <AppCodeEditor
          className="overflow-hidden border-x-0 border-t-0"
          value={sql}
          onChange={setDatasetSQL}
          onMetaEnter={runButton ? runButton.onClick : undefined}
          variant={null}
          readOnly={readOnly}
        />

        {error && <ErrorClosableContainer error={error} />}
      </FileCard>
    );
  }
);

SQLContainer.displayName = 'SQLContainer';
