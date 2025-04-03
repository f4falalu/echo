'use client';

import { Command, ReturnKey } from '@/components/ui/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { Button } from '@/components/ui/buttons/Button';
import React, { useState } from 'react';
import type { AppVerticalCodeSplitterProps } from './AppVerticalCodeSplitter';
import { cn } from '@/lib/classMerge';
import { ErrorClosableContainer } from '@/components/ui/error/ErrorClosableContainer';
import { AppDiffCodeEditor } from '@/components/ui/inputs';
import { Copy2 } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { VersionPill } from '@/components/ui/tags/VersionPill';

export const DiffSQLContainer: React.FC<{
  className?: string;
  originalValue: string | undefined;
  value: string | undefined;
  setValue: (value: string) => void;
  onRunQuery: () => Promise<void>;
  onSaveSQL?: AppVerticalCodeSplitterProps['onSaveSQL'];
  disabledSave?: AppVerticalCodeSplitterProps['disabledSave'];
  error?: string | null;
  language: 'sql' | 'yaml';
  fileName?: string;
  versionNumber?: number;
}> = React.memo(
  ({
    language,
    disabledSave,
    className = '',
    originalValue,
    value,
    setValue,
    onRunQuery,
    onSaveSQL,
    error,
    fileName,
    versionNumber
  }) => {
    const [isRunning, setIsRunning] = useState(false);
    const { openInfoMessage } = useBusterNotifications();

    const onCopySQL = useMemoizedFn(() => {
      navigator.clipboard.writeText(value || '');
      openInfoMessage('Copied to clipboard');
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
        <div className="bg-item-select flex h-8 w-full items-center justify-between border-b px-2.5">
          <div className="flex items-center gap-x-1.5">
            <Text>{fileName}</Text>
            {versionNumber && <VersionPill version_number={versionNumber} />}
          </div>
          <Button prefix={<Copy2 />} variant="ghost" onClick={onCopySQL} />
        </div>
        <AppDiffCodeEditor
          className="overflow-hidden"
          modified={value || ''}
          original={originalValue || ''}
          language={language}
          onChange={setValue}
          readOnly={true}
        />
        <div className="relative hidden items-center justify-between border-t px-4 py-2.5">
          <Button onClick={onCopySQL}>Copy SQL</Button>

          <div className="flex items-center gap-2">
            {onSaveSQL && (
              <Button
                disabled={disabledSave || !value || isRunning}
                variant="black"
                onClick={onSaveSQL}>
                Save
              </Button>
            )}

            <Button
              variant="default"
              loading={isRunning}
              disabled={!value}
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

DiffSQLContainer.displayName = 'DiffSQLContainer';
