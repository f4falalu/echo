import { useBusterChatContextSelector } from '@/context/Chats';
import type { SelectedFile } from '../interfaces';
import { usePrevious } from 'ahooks';
import { useEffect } from 'react';

export const useAutoChangeLayout = ({
  lastMessageId,
  onSetSelectedFile
}: {
  lastMessageId: string;
  onSetSelectedFile: (file: SelectedFile) => void;
}) => {
  const message = useBusterChatContextSelector((x) => x.chatsMessages[lastMessageId]);
  const reasoningMessagesLength = message?.reasoning?.length;
  const previousReasoningMessagesLength = usePrevious(reasoningMessagesLength);
  const isCompletedStream = message?.isCompletedStream;
  const isLoading = !isCompletedStream;
  const hasReasoning = !!reasoningMessagesLength;
  const previousIsEmpty = previousReasoningMessagesLength === 0;

  useEffect(() => {
    if (isLoading && previousIsEmpty && hasReasoning) {
      onSetSelectedFile({ id: lastMessageId, type: 'reasoning' });
    }
  }, [isLoading, hasReasoning, previousIsEmpty]);
};
