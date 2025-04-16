'use client';

import {
  useGetChatMessageMemoized,
  useGetChatMessage,
  useGetChatMemoized
} from '@/api/buster_rest/chats';
import type { SelectedFile } from '../interfaces';
import { MutableRefObject, useEffect, useRef } from 'react';
import findLast from 'lodash/findLast';
import { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useGetFileLink } from '@/context/Assets/useGetFileLink';
import { useChatLayoutContextSelector } from '../ChatLayoutContext';
import { usePrevious } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { assetParamsToRoute } from '../ChatLayoutContext/helpers';
import { useGetInitialChatFile } from './useGetInitialChatFile';

export const useAutoChangeLayout = ({
  lastMessageId,
  selectedFileId,
  chatId
}: {
  lastMessageId: string;
  selectedFileId: string | undefined;
  chatId: string | undefined;
}) => {
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);
  const messageId = useChatLayoutContextSelector((x) => x.messageId);
  const metricId = useChatLayoutContextSelector((x) => x.metricId);
  const dashboardId = useChatLayoutContextSelector((x) => x.dashboardId);
  const secondaryView = useChatLayoutContextSelector((x) => x.secondaryView);
  const dashboardVersionNumber = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);
  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  const isVersionHistoryMode = useChatLayoutContextSelector((x) => x.isVersionHistoryMode);
  const isCompletedStream = useGetChatMessage(lastMessageId, (x) => x?.isCompletedStream);

  const getInitialChatFileHref = useGetInitialChatFile();

  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const previousLastMessageId = useRef<string | null>(null);
  const reasoningMessagesLength = useGetChatMessage(
    lastMessageId,
    (x) => x?.reasoning_message_ids?.length || 0
  );
  const { getFileLinkMeta } = useGetFileLink();

  const previousIsCompletedStream = usePrevious(isCompletedStream);

  const hasReasoning = !!reasoningMessagesLength;

  useEffect(() => {
    //this will trigger when the chat is streaming and is has not completed yet (new chat)
    if (
      !isCompletedStream &&
      hasReasoning &&
      previousLastMessageId.current !== lastMessageId &&
      chatId
    ) {
      console.log('trigger reasoning page!', previousLastMessageId.current, lastMessageId);
      previousLastMessageId.current = lastMessageId;
      onSetSelectedFile({ id: lastMessageId, type: 'reasoning', versionNumber: undefined });
    }

    //this will when the chat is completed and it WAS streaming
    else if (isCompletedStream && previousIsCompletedStream === false) {
      //
      const chatMessage = getChatMessageMemoized(lastMessageId);
      const lastFileId = findLast(chatMessage?.response_message_ids, (id) => {
        const responseMessage = chatMessage?.response_messages[id];
        return responseMessage?.type === 'file';
      });
      const lastFile = chatMessage?.response_messages[lastFileId || ''] as
        | BusterChatResponseMessage_file
        | undefined;

      //this will trigger when the chat was streaming (new chat)
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
            type: lastFile.file_type,
            versionNumber: selectedVersionNumber
          });
        }

        if (link) {
          onChangePage(link);
        }
        return;
      }
    }
    //this will trigger on a page refresh and the chat is completed
    else if (isCompletedStream && chatId) {
      const isChatOnlyMode = !metricId && !dashboardId && !messageId;
      if (isChatOnlyMode) {
        return;
      }

      const href = getInitialChatFileHref({
        metricId,
        dashboardId,
        messageId,
        chatId,
        secondaryView,
        dashboardVersionNumber,
        metricVersionNumber
      });

      if (href) {
        onChangePage(href);
      }
    }
  }, [isCompletedStream, hasReasoning, lastMessageId]);
};
