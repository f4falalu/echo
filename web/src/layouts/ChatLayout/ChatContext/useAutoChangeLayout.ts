'use client';

import { useGetChatMessageMemoized, useGetChatMessage } from '@/api/buster_rest/chats';
import type { SelectedFile } from '../interfaces';
import { MutableRefObject, useEffect, useRef } from 'react';
import findLast from 'lodash/findLast';
import { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useGetFileLink } from '@/context/Assets/useGetFileLink';
import { useChatLayoutContextSelector } from '../ChatLayoutContext';
import { useMemoizedFn, usePrevious } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const useAutoChangeLayout = ({
  lastMessageId,
  selectedFileId,
  chatId
}: {
  lastMessageId: string;
  selectedFileId: string | undefined;
  chatId: string | undefined;
}) => {
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);
  const messageId = useChatLayoutContextSelector((x) => x.messageId);
  const metricId = useChatLayoutContextSelector((x) => x.metricId);
  const dashboardId = useChatLayoutContextSelector((x) => x.dashboardId);
  const dashboardVersionNumber = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);
  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  const isVersionHistoryMode = useChatLayoutContextSelector((x) => x.isVersionHistoryMode);
  const isCompletedStream = useGetChatMessage(lastMessageId, (x) => x?.isCompletedStream);

  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const previousLastMessageId = useRef<string | null>(null);
  const reasoningMessagesLength = useGetChatMessage(
    lastMessageId,
    (x) => x?.reasoning_message_ids?.length || 0
  );
  const getChatMessageMemoized = useGetChatMessageMemoized();
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
      handle_isStreaming({ previousLastMessageId, onSetSelectedFile, lastMessageId });
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

      const chatMessage = getChatMessageMemoized(lastMessageId);

      //reasoning_message_mode
      if (messageId) {
        const messageExists = !!chatMessage?.reasoning_message_ids.find((id) => id === messageId);
        if (messageExists) {
          return;
        } else {
          onChangePage(
            createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID,
              chatId
            })
          );
        }
      }

      //dashboard_mode
      if (dashboardId) {
        if (!dashboardVersionNumber) {
          const lastMatchingDashboardInChat = chatMessage?.response_message_ids.reduce<
            BusterChatResponseMessage_file | undefined
          >((acc, messageId) => {
            const message = chatMessage?.response_messages[messageId]!;
            const isFile =
              message.type === 'file' &&
              message.file_type === 'dashboard' &&
              message.id === dashboardId;
            if (isFile) {
              return message;
            }
            return acc;
          }, undefined);

          if (lastMatchingDashboardInChat) {
            onChangePage(
              createBusterRoute({
                route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
                dashboardId: lastMatchingDashboardInChat.id,
                versionNumber: lastMatchingDashboardInChat.version_number,
                chatId
              })
            );
          }
        } else {
          return;
        }
      }

      //metric_mode
      if (metricId) {
        if (!metricVersionNumber) {
          const lastMatchingMetricInChat = chatMessage?.response_message_ids.reduce<
            BusterChatResponseMessage_file | undefined
          >((acc, messageId) => {
            const message = chatMessage?.response_messages[messageId]!;
            const isFile =
              message.type === 'file' && message.file_type === 'metric' && message.id === metricId;
            if (isFile) {
              return message;
            }
            return acc;
          }, undefined);

          if (lastMatchingMetricInChat) {
            onChangePage(
              createBusterRoute({
                route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
                metricId,
                versionNumber: lastMatchingMetricInChat.version_number,
                chatId
              })
            );
          }
        } else {
          return;
        }
      }
    }
  }, [isCompletedStream, hasReasoning, lastMessageId]);
};

const handle_isStreaming = ({
  previousLastMessageId,
  onSetSelectedFile,
  lastMessageId
}: {
  previousLastMessageId: MutableRefObject<string | null>;
  onSetSelectedFile: (file: SelectedFile) => void;
  lastMessageId: string;
}) => {
  previousLastMessageId.current = lastMessageId;
  onSetSelectedFile({ id: lastMessageId, type: 'reasoning', versionNumber: undefined });
};
