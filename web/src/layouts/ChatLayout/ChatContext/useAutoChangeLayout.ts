'use client';

import { useGetChatMemoized, useGetChatMessage } from '@/api/buster_rest/chats';
import type { SelectedFile } from '../interfaces';
import { useEffect, useRef } from 'react';
import findLast from 'lodash/findLast';
import { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';

export const useAutoChangeLayout = ({
  lastMessageId,
  onSetSelectedFile,
  selectedFileId
}: {
  lastMessageId: string;
  onSetSelectedFile: (file: SelectedFile) => void;
  selectedFileId: string | undefined;
}) => {
  const previousLastMessageId = useRef<string | null>(null);
  const reasoningMessagesLength = useGetChatMessage(
    lastMessageId,
    (x) => x?.reasoning_message_ids?.length || 0
  );
  const getChatMessageMemoized = useGetChatMemoized();

  const isCompletedStream = useGetChatMessage(lastMessageId, (x) => x?.isCompletedStream);
  const hasReasoning = !!reasoningMessagesLength;

  //change the page to reasoning file if we get a reasoning message
  useEffect(() => {
    console.log(isCompletedStream, hasReasoning, lastMessageId, previousLastMessageId.current);
    if (!isCompletedStream && hasReasoning && previousLastMessageId.current !== lastMessageId) {
      // hasSeeningReasoningPage.current = true;
      onSetSelectedFile({ id: lastMessageId, type: 'reasoning' });
      previousLastMessageId.current = lastMessageId;
    }

    if (isCompletedStream) {
      const chatMessage = getChatMessageMemoized(lastMessageId);
      const lastFileId = findLast(chatMessage?.response_message_ids, (id) => {
        const responseMessage = chatMessage?.response_messages[id];
        return responseMessage?.type === 'file';
      });
      const lastFile = chatMessage?.response_messages[lastFileId || ''] as
        | BusterChatResponseMessage_file
        | undefined;

      if (lastFile && lastFileId && selectedFileId !== lastFileId) {
        onSetSelectedFile({ id: lastFileId, type: lastFile.file_type });
      }
    }
  }, [isCompletedStream, hasReasoning, lastMessageId]);
};
