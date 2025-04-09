'use client';

import { Button } from '@/components/ui/buttons';
import { ArrowLeft } from '@/components/ui/icons';
import React from 'react';
import { useCloseVersionHistory } from './useCloseVersionHistory';
import { VersionHistoryHeaderButtons } from './VersionHistoryHeaderButtons';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';

export const FileContainerHeaderVersionHistory = React.memo(() => {
  return (
    <div className="flex w-full items-center justify-between gap-x-1.5">
      <ExitVersionHistoryButton />
      <VersionHistoryHeaderButtons />
    </div>
  );
});

FileContainerHeaderVersionHistory.displayName = 'FileContainerHeaderVersionHistory';

const ExitVersionHistoryButton = React.memo(({}: {}) => {
  const onCloseVersionHistory = useCloseVersionHistory();
  const { selectedFile } = useChatLayoutContextSelector((x) => x);
  const chatId = useChatLayoutContextSelector((x) => x.chatId);

  return (
    <Button
      variant="link"
      prefix={<ArrowLeft />}
      onClick={() =>
        selectedFile?.type &&
        onCloseVersionHistory({
          assetId: selectedFile?.id,
          type: selectedFile?.type as 'metric' | 'dashboard',
          chatId
        })
      }>
      Exit version history
    </Button>
  );
});
ExitVersionHistoryButton.displayName = 'ExitVersionHistoryButton';
