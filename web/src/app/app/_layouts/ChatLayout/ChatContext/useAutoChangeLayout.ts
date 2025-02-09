import { IBusterChat, useBusterChatContextSelector } from '@/context/Chats';
import { SelectedFile } from '../interfaces';
import { usePrevious } from 'ahooks';
import { useEffect } from 'react';

export const useAutoChangeLayout = ({
  lastMessageId,
  chat,
  onSetSelectedFile
}: {
  lastMessageId: string;
  chat: IBusterChat | undefined;
  onSetSelectedFile: (file: SelectedFile) => void;
}) => {
  const message = useBusterChatContextSelector((x) => x.chatsMessages[lastMessageId]);
  const reasoningMessagesLength = message?.reasoning?.length;
  const previousReasoningMessagesLength = usePrevious(reasoningMessagesLength);
  const isCompletedStream = message?.isCompletedStream;
  const isFollowupMessage = chat?.isFollowupMessage;
  const isNewChat = chat?.isNewChat;
  const isLoading = isNewChat || isFollowupMessage || !isCompletedStream;
  const hasReasoning = !!reasoningMessagesLength;
  const previousIsEmpty = previousReasoningMessagesLength === 0;

  useEffect(() => {
    if (isLoading && previousIsEmpty && hasReasoning) {
      onSetSelectedFile({ id: lastMessageId, type: 'reasoning' });
    }
  }, [isLoading, hasReasoning, previousIsEmpty]);
};
