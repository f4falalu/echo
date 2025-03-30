'use client';

import { Command, ReturnKey } from '@/components/ui/icons';
import { AppCodeEditor } from '@/components/ui/inputs/AppCodeEditor';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { Button } from '@/components/ui/buttons/Button';
import React, { useState } from 'react';
import type { AppVerticalCodeSplitterProps } from './AppVerticalCodeSplitter';
import { cn } from '@/lib/classMerge';
import { ErrorClosableContainer } from '@/components/ui/error/ErrorClosableContainer';

export const SQLContainer: React.FC<{
  className?: string;
  sql: string | undefined;
  setDatasetSQL: (sql: string) => void;
  onRunQuery: () => Promise<void>;
  onSaveSQL?: AppVerticalCodeSplitterProps['onSaveSQL'];
  disabledSave?: AppVerticalCodeSplitterProps['disabledSave'];
  error?: string | null;
}> = React.memo(
  ({ disabledSave, className = '', sql, setDatasetSQL, onRunQuery, onSaveSQL, error }) => {
    const [isRunning, setIsRunning] = useState(false);
    const { openInfoMessage } = useBusterNotifications();

    const onCopySQL = useMemoizedFn(() => {
      navigator.clipboard.writeText(sql || '');
      openInfoMessage('SQL copied to clipboard');
    });

    const onRunQueryPreflight = useMemoizedFn(async () => {
      setIsRunning(true);
      await onRunQuery();
      setIsRunning(false);
    });

    return (
      <div
        className={cn(
          'flex h-full w-full flex-col overflow-hidden',
          'bg-background rounded border',
          className
        )}>
        <AppCodeEditor
          className="overflow-hidden border-x-0 border-t-0"
          value={sql}
          onChange={setDatasetSQL}
          onMetaEnter={onRunQueryPreflight}
          variant={null}
        />
        <div className="bg-border-color my-0! h-[0.5px] w-full" />
        <div className="relative flex items-center justify-between px-4 py-2.5">
          <Button onClick={onCopySQL}>Copy SQL</Button>

          <div className="flex items-center gap-2">
            {onSaveSQL && (
              <Button
                disabled={disabledSave || !sql || isRunning}
                variant="black"
                onClick={onSaveSQL}>
                Save
              </Button>
            )}

            <Button
              variant="default"
              loading={isRunning}
              disabled={!sql}
              className="flex items-center space-x-0"
              onClick={onRunQueryPreflight}
              suffix={
                <div className="flex items-center gap-x-1 text-sm">
                  <Command />
                  <ReturnKey />
                </div>
              }>
              Run
            </Button>
          </div>

          {error && <ErrorClosableContainer error={error} />}
        </div>
      </div>
    );
  }
);

SQLContainer.displayName = 'SQLContainer';
