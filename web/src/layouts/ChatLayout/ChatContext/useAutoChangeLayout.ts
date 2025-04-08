'use client';

import { useGetChatMessageMemoized, useGetChatMessage } from '@/api/buster_rest/chats';
import type { SelectedFile } from '../interfaces';
import { useEffect, useRef } from 'react';
import findLast from 'lodash/findLast';
import { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useGetFileLink } from '@/context/Assets/useGetFileLink';
import { useChatLayoutContextSelector } from '../ChatLayoutContext';

export const useAutoChangeLayout = ({
  lastMessageId,
  onSetSelectedFile,
  selectedFileId,
  chatId
}: {
  lastMessageId: string;
  onSetSelectedFile: (file: SelectedFile) => void;
  selectedFileId: string | undefined;
  chatId: string | undefined;
}) => {
  const isVersionHistoryMode = useChatLayoutContextSelector((x) => x.isVersionHistoryMode);
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const previousLastMessageId = useRef<string | null>(null);
  const reasoningMessagesLength = useGetChatMessage(
    lastMessageId,
    (x) => x?.reasoning_message_ids?.length || 0
  );
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const { getFileLinkMeta } = useGetFileLink();

  const isCompletedStream = useGetChatMessage(lastMessageId, (x) => x?.isCompletedStream);

  const hasReasoning = !!reasoningMessagesLength;

  //change the page to reasoning file if we get a reasoning message
  //change the page to the file if we get a file
  useEffect(() => {
    if (
      !isCompletedStream &&
      hasReasoning &&
      previousLastMessageId.current !== lastMessageId &&
      chatId
    ) {
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

      if (lastFileId && lastFile) {
        const { link, isSelected, selectedVersionNumber } = getFileLinkMeta({
          fileId: lastFileId,
          fileType: lastFile.file_type,
          chatId,
          versionNumber: lastFile.version_number,
          useVersionHistoryMode: !chatId
        });

        if (
          !isSelected &&
          selectedVersionNumber !== lastFile.version_number &&
          selectedFileId !== lastFileId
        ) {
          onSetSelectedFile({
            id: lastFileId,
            type: lastFile.file_type
          });
        }

        if (link && !selectedVersionNumber && !isVersionHistoryMode) {
          onChangePage(link);
        }
      }
    }
  }, [isCompletedStream, hasReasoning, lastMessageId]);
};
