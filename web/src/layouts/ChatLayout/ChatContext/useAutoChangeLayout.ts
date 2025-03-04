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
  const message = useMessageIndividual(lastMessageId);
  const reasoningMessagesLength = message?.reasoning?.length;
  const isCompletedStream = message?.isCompletedStream;
  const isLoading = !isCompletedStream;
  const hasReasoning = !!reasoningMessagesLength;

  //change the page to reasoning file if we get a reasoning message
  useEffect(() => {
    if (isLoading && !hasSeeningReasoningPage.current && hasReasoning) {
      hasSeeningReasoningPage.current = true;
      onSetSelectedFile({ id: lastMessageId, type: 'reasoning' });
    }
  }, [isLoading, hasReasoning]);
};
