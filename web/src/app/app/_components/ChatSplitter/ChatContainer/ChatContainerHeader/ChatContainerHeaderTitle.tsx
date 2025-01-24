import { Text } from '@/components/text';
import React from 'react';
import { useChatSplitterContextSelector } from '../../ChatSplitterContext';

export const ChatContainerHeaderTitle: React.FC<{}> = React.memo(() => {
  const hasFile = useChatSplitterContextSelector((state) => state.hasFile);
  const selectedFileTitle = useChatSplitterContextSelector((state) => state.selectedFileTitle);

  return (
    <div className="flex items-center">
      <Text>{selectedFileTitle}</Text>
    </div>
  );
});

ChatContainerHeaderTitle.displayName = 'ChatContainerHeaderTitle';
