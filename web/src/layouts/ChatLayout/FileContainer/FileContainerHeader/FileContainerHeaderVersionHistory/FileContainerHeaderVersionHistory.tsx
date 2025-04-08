'use client';

import { Button } from '@/components/ui/buttons';
import { ArrowLeft } from '@/components/ui/icons';
import React from 'react';
import { useCloseVersionHistory } from './useCloseVersionHistory';
import { VersionHistoryHeaderButtons } from './VersionHistoryHeaderButtons';

export const FileContainerHeaderVersionHistory = React.memo(() => {
  const onCloseVersionHistory = useCloseVersionHistory();

  return (
    <div className="flex w-full items-center justify-between gap-x-1.5">
      <ExitVersionHistoryButton onCloseVersionHistory={onCloseVersionHistory} />
      <VersionHistoryHeaderButtons />
    </div>
  );
});

FileContainerHeaderVersionHistory.displayName = 'FileContainerHeaderVersionHistory';

const ExitVersionHistoryButton = React.memo(
  ({ onCloseVersionHistory }: { onCloseVersionHistory: () => void }) => {
    return (
      <Button variant="link" prefix={<ArrowLeft />} onClick={onCloseVersionHistory}>
        Exit version history
      </Button>
    );
  }
);
ExitVersionHistoryButton.displayName = 'ExitVersionHistoryButton';
