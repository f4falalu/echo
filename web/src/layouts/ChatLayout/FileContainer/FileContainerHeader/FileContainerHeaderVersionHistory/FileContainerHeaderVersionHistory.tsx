'use client';

import { Button } from '@/components/ui/buttons';
import { ArrowLeft, History } from '@/components/ui/icons';
import React from 'react';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import first from 'lodash/first';
import { useCloseVersionHistory } from './useCloseVersionHistory';
import { useListVersionHistories } from '@/components/features/versionHistory';
import { useMemoizedFn } from '@/hooks';

export const FileContainerHeaderVersionHistory = React.memo(() => {
  const removeVersionHistoryQueryParams = useCloseVersionHistory();

  return (
    <div className="flex w-full items-center justify-between gap-x-1.5">
      <ExitVersionHistoryButton removeVersionHistoryQueryParams={removeVersionHistoryQueryParams} />
      <DisplayVersionHistory />
    </div>
  );
});

FileContainerHeaderVersionHistory.displayName = 'FileContainerHeaderVersionHistory';

const DisplayVersionHistory = React.memo(({}: {}) => {
  const selectedFile = useChatLayoutContextSelector((x) => x.selectedFile);
  const { listItems, isRestoringVersion, selectedQueryVersion, onClickRestoreVersion } =
    useListVersionHistories({
      assetId: selectedFile?.id || '',
      type: selectedFile?.type as 'metric' | 'dashboard'
    });

  const currentVersion = first(listItems)?.version_number;
  const isSelectedVersionCurrent = selectedQueryVersion === currentVersion;

  const onClickRestoreVersionPreflight = useMemoizedFn(async () => {
    if (selectedQueryVersion) {
      await onClickRestoreVersion(selectedQueryVersion, true);
    }
  });

  return (
    <div className="flex space-x-1.5">
      <Button variant="ghost" prefix={<History />}>{`Version ${selectedQueryVersion || 0}`}</Button>
      <Button
        variant="black"
        disabled={isSelectedVersionCurrent || !currentVersion}
        onClick={onClickRestoreVersionPreflight}
        loading={isRestoringVersion}>
        Restore version
      </Button>
    </div>
  );
});
DisplayVersionHistory.displayName = 'DisplayVersionHistory';

const ExitVersionHistoryButton = React.memo(
  ({ removeVersionHistoryQueryParams }: { removeVersionHistoryQueryParams: () => void }) => {
    return (
      <Button variant="link" prefix={<ArrowLeft />} onClick={removeVersionHistoryQueryParams}>
        Exit version history
      </Button>
    );
  }
);
ExitVersionHistoryButton.displayName = 'ExitVersionHistoryButton';
