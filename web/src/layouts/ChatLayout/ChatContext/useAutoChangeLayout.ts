'use client';

import { useGetChatMessage } from '@/api/buster_rest/chats';
import type { SelectedFile } from '../interfaces';
import { useEffect, useRef } from 'react';

export const useAutoChangeLayout = ({
  lastMessageId,
  onSetSelectedFile
}: {
  lastMessageId: string;
  onSetSelectedFile: (file: SelectedFile) => void;
}) => {
  const previousLastMessageId = useRef<string | null>(null);
  const reasoningMessagesLength = useGetChatMessage(
    lastMessageId,
    (x) => x?.reasoning_message_ids?.length || 0
  );
  const isCompletedStream = useGetChatMessage(lastMessageId, (x) => x?.isCompletedStream);
  const hasReasoning = !!reasoningMessagesLength;

  //change the page to reasoning file if we get a reasoning message
  useEffect(() => {
    if (!isCompletedStream && hasReasoning && previousLastMessageId.current !== lastMessageId) {
      // hasSeeningReasoningPage.current = true;
      onSetSelectedFile({ id: lastMessageId, type: 'reasoning' });
      previousLastMessageId.current = lastMessageId;
    }
  }, [isCompletedStream, hasReasoning, lastMessageId]);
};
