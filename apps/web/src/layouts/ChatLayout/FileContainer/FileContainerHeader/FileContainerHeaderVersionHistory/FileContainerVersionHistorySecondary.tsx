import React from 'react';
import { MetricContainerHeaderSegment } from '../MetricContainerHeaderSegment';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';

export const FileContainerVersionHistorySecondary = React.memo(() => {
  const chatId = useChatLayoutContextSelector((x) => x.chatId);
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView);
  const selectedFileId = useChatLayoutContextSelector((x) => x.selectedFile?.id);
  const selectedFileType = useChatLayoutContextSelector((x) => x.selectedFile?.type);

  if (!selectedFileView || !selectedFileId || !selectedFileType) return null;

  return (
    <div>
      <MetricContainerHeaderSegment
        selectedFileView={selectedFileView}
        selectedFileId={selectedFileId}
        chatId={chatId}
        overrideOldVersionMessage
        isVersionHistoryMode
      />
    </div>
  );
});

FileContainerVersionHistorySecondary.displayName = 'FileContainerVersionHistorySecondary';
