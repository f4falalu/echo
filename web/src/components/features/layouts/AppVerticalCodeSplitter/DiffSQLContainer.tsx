'use client';

import { Command, ReturnKey } from '@/components/ui/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { Button } from '@/components/ui/buttons/Button';
import React, { useMemo, useState } from 'react';
import type { AppVerticalCodeSplitterProps } from './AppVerticalCodeSplitter';
import { cn } from '@/lib/classMerge';
import { ErrorClosableContainer } from '@/components/ui/error/ErrorClosableContainer';
import { AppDiffCodeEditor } from '@/components/ui/inputs';
import { Copy2 } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { VersionPill } from '@/components/ui/tags/VersionPill';
import { FileCard } from '@/components/ui/card/FileCard';

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
      <FileCard
        headerButtons={useMemo(
          () => (
            <Button prefix={<Copy2 />} variant="ghost" onClick={onCopySQL} />
          ),
          [onCopySQL]
        )}
        fileName={useMemo(
          () => (
            <div className="flex items-center gap-x-1.5">
              <Text>{fileName}</Text>
              {versionNumber && <VersionPill version_number={versionNumber} />}
            </div>
          ),
          [fileName, versionNumber]
        )}>
        <AppDiffCodeEditor
          className="overflow-hidden"
          modified={value || ''}
          original={originalValue || ''}
          language={language}
          onChange={setValue}
          readOnly={true}
        />
      </FileCard>
    );
  }
);

DiffSQLContainer.displayName = 'DiffSQLContainer';
