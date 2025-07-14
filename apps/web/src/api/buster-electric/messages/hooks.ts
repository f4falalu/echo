import { useMemo } from 'react';
import { messageShape, messagesShape } from './shapes';
import { useShape, useShapeStream } from '../instances';
import { useChatUpdate } from '@/context/Chats/useChatUpdate';
import { updateMessageShapeToIChatMessage } from './helpers';
import { useMemoizedFn } from '@/hooks';
import { prefetchGetListChats, useGetChatMemoized } from '@/api/buster_rest/chats';
import uniq from 'lodash/uniq';
import type { ChatMessageResponseMessage_File } from '@buster/server-shared/chats';
import type { BusterChatMessage } from '../../asset_interfaces/chat';
import { useQueryClient } from '@tanstack/react-query';
import { dashboardQueryKeys } from '../../query_keys/dashboard';
import last from 'lodash/last';
import isEmpty from 'lodash/isEmpty';

export const useGetMessage = ({ chatId, messageId }: { chatId: string; messageId: string }) => {
  const shape = useMemo(() => messageShape({ chatId, messageId }), [chatId, messageId]);
  return useShape(shape);
};

export const useGetMessages = ({ chatId }: { chatId: string }) => {
  const shape = useMemo(() => messagesShape({ chatId }), [chatId]);
  return useShape(shape);
};

const updateOperations: Array<'insert' | 'update' | 'delete'> = ['update'];

export const useTrackAndUpdateMessageChanges = (
  {
    chatId,
    messageId,
    isStreamingMessage
  }: {
    chatId: string | undefined;
    messageId: string;
    isStreamingMessage: boolean;
  },
  callback?: (message: ReturnType<typeof updateMessageShapeToIChatMessage>) => void
) => {
  const { onUpdateChatMessage, onUpdateChat } = useChatUpdate();
  const checkIfWeHaveAFollowupDashboard = useCheckIfWeHaveAFollowupDashboard();
  const getChatMemoized = useGetChatMemoized();

  const subscribe = !!chatId && !!messageId && messageId !== 'undefined';

  const shape = useMemo(
    () => messageShape({ chatId: chatId || '', messageId }),
    [chatId, messageId]
  );

  return useShapeStream(
    shape,
    updateOperations,
    useMemoizedFn((message) => {
      if (message && message.value && chatId) {
        const iChatMessage = updateMessageShapeToIChatMessage(message.value);
        const chat = getChatMemoized(chatId);

        if (chat) {
          //ADD NEW MESSAGE ID TO CHAT
          const currentMessageIds = chat.message_ids;
          const allMessageIds = uniq([...currentMessageIds, messageId]);
          if (currentMessageIds.length !== allMessageIds.length) {
            onUpdateChat({
              ...chat,
              message_ids: allMessageIds
            });
          }

          //check if we have a files in the message
          const hasFiles = iChatMessage.reasoning_message_ids?.some((id) => {
            const reasoningMessage = iChatMessage.response_messages?.[id];
            return (
              reasoningMessage &&
              (reasoningMessage as ChatMessageResponseMessage_File)?.file_type === 'dashboard'
            );
          });
          if (hasFiles) {
            prefetchGetListChats();
          }

          if (!isEmpty(iChatMessage.reasoning_message_ids)) {
            checkIfWeHaveAFollowupDashboard(iChatMessage);
          }

          if (iChatMessage.is_completed) {
            prefetchGetListChats();
          }
        }
        callback?.(iChatMessage);
        onUpdateChatMessage(iChatMessage);
      }
    }),
    subscribe
  );
};

const useCheckIfWeHaveAFollowupDashboard = () => {
  const queryClient = useQueryClient();
  const method = (message: Partial<BusterChatMessage>) => {
    const lastResponseMessageId = last(message.response_message_ids || []) || '';
    const lastResponseMessage = message.response_messages?.[lastResponseMessageId] as
      | ChatMessageResponseMessage_File
      | undefined;
    const hasDashboardInMessage =
      lastResponseMessage && lastResponseMessage?.file_type === 'dashboard';

    if (hasDashboardInMessage) {
      const fileId = lastResponseMessage?.id;
      const versionNumber = lastResponseMessage?.version_number;
      const { queryKey } = dashboardQueryKeys.dashboardGetDashboard(fileId, versionNumber);
      const isFoundInCache = queryClient.getQueryData(queryKey);
      if (isFoundInCache) {
        queryClient.invalidateQueries({ queryKey });
      }
    }
  };

  return useMemoizedFn(method);
};
