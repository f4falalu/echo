'use client';

import { useGetChatMessageMemoized, useGetChatMessage } from '@/api/buster_rest/chats';
import type { SelectedFile } from '../interfaces';
import { useEffect, useRef } from 'react';
import findLast from 'lodash/findLast';
import { BusterChatResponseMessage_file, FileType } from '@/api/asset_interfaces/chat';
import { useMemoizedFn } from '@/hooks';
import { useChatLayoutContextSelector } from '../ChatLayoutContext';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';

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
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const previousLastMessageId = useRef<string | null>(null);
  const reasoningMessagesLength = useGetChatMessage(
    lastMessageId,
    (x) => x?.reasoning_message_ids?.length || 0
  );
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const getFileHref = useGetFileHref({ chatId });

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
        if (selectedFileId !== lastFileId) {
        }

        const href = getFileHref({
          fileId: lastFileId,
          fileType: lastFile.file_type,
          currentFile: lastFile
        });

        console.log(href);
        if (href) {
          //   onChangePage(href);

          onSetSelectedFile({
            id: lastFileId,
            type: lastFile.file_type,
            versionNumber: lastFile.version_number
          });
        }
      }
    }
  }, [isCompletedStream, chatId, hasReasoning, lastMessageId]);
};

const useGetFileHref = ({ chatId }: { chatId: string | undefined }) => {
  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  const dashboardVersionNumber = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);

  const getFileHref = useMemoizedFn(
    ({
      fileId,
      fileType,
      currentFile
    }: {
      fileId: string;
      fileType: FileType;
      currentFile: BusterChatResponseMessage_file | undefined;
    }) => {
      if (!currentFile || !chatId || metricVersionNumber || dashboardVersionNumber) return false;

      if (fileType === 'metric') {
        if (metricVersionNumber) return false;
        return createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
          chatId: chatId,
          metricId: fileId,
          versionNumber: currentFile.version_number
        });
      }

      if (fileType === 'dashboard') {
        if (dashboardVersionNumber) return false;
        return createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
          chatId: chatId,
          dashboardId: fileId,
          versionNumber: currentFile.version_number
        });
      }

      if (fileType === 'reasoning') {
        return false;
      }

      const exhaustiveCheck: never = fileType;

      return false;
    }
  );

  return getFileHref;
};
