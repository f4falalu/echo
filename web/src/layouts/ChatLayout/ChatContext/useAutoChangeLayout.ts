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
  const hasSeeningReasoningPage = useRef(false); //used when there is a delay in page load
  const reasoningMessagesLength = useMessageIndividual(
    lastMessageId,
    (x) => x?.reasoning_message_ids?.length || 0
  );
  const isCompletedStream = useMessageIndividual(lastMessageId, (x) => x?.isCompletedStream);
  const hasReasoning = !!reasoningMessagesLength;

  //change the page to reasoning file if we get a reasoning message
  useEffect(() => {
    if (!isCompletedStream && !hasSeeningReasoningPage.current && hasReasoning) {
      hasSeeningReasoningPage.current = true;
      onSetSelectedFile({ id: lastMessageId, type: 'reasoning' });
    }
  }, [isCompletedStream, hasReasoning]);
};
