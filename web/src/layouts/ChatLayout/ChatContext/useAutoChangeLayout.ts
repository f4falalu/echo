'use client';

import { useMessageIndividual } from '@/context/Chats';
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
  const reasoningMessagesLength = useMessageIndividual(
    lastMessageId,
    (x) => x?.reasoning_message_ids?.length || 0
  );
  const isCompletedStream = useMessageIndividual(lastMessageId, (x) => x?.isCompletedStream);
  const hasReasoning = !!reasoningMessagesLength;

  console.log('lastMessageId', lastMessageId, hasReasoning);

  //change the page to reasoning file if we get a reasoning message
  useEffect(() => {
    if (!isCompletedStream && hasReasoning && previousLastMessageId.current !== lastMessageId) {
      // hasSeeningReasoningPage.current = true;
      onSetSelectedFile({ id: lastMessageId, type: 'reasoning' });
      previousLastMessageId.current = lastMessageId;
    }
  }, [isCompletedStream, hasReasoning, lastMessageId]);
};
