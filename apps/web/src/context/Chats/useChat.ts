import { useNavigate } from '@tanstack/react-router';
import { create } from 'mutative';
import type { FileType } from '@/api/asset_interfaces/chat';
import { useGetChatMemoized, useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { useStartNewChat, useStopChat } from '@/api/buster_rest/chats/queryRequestsV2';
import { useChatUpdate } from '@/api/buster_rest/chats/useChatUpdate';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

type StartChatParams = {
  prompt: string | undefined;
  datasetId?: string; //unused for now
  metricId?: string; //this is to start a NEW chat from a metric
  dashboardId?: string; //this is to start a NEW chat from a dashboard
  messageId?: string; //this is used to replace a message in the chat
  chatId?: string; //this is used to follow up a chat
};

export const useChat = () => {
  const navigate = useNavigate();
  const { mutateAsync: startNewChat, isPending: isSubmittingChat } = useStartNewChat();
  const { mutate: stopChatMutation } = useStopChat();
  const getChatMemoized = useGetChatMemoized();
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const { onUpdateChat, onUpdateChatMessage } = useChatUpdate();

  const startChat = async ({
    prompt,
    chatId,
    metricId,
    dashboardId,
    messageId,
  }: StartChatParams) => {
    const res = await startNewChat({
      prompt,
      chat_id: chatId,
      metric_id: metricId,
      dashboard_id: dashboardId,
      message_id: messageId,
    });

    const { message_ids, id } = res;

    const hasMultipleMessages = message_ids.length > 1;
    if (!hasMultipleMessages) {
      navigate({
        to: '/app/chats/$chatId',
        params: { chatId: id },
      });
    }
  };

  const onStartNewChat = useMemoizedFn(async ({ prompt }: { prompt: string }) => {
    return startChat({
      prompt,
    });
  });

  const onStartChatFromFile = useMemoizedFn(
    async ({
      prompt,
      fileId,
      fileType,
    }: {
      prompt: string;
      fileId: string;
      fileType: FileType;
    }) => {
      return startChat({
        prompt,
        metricId: fileType === 'metric' ? fileId : undefined,
        dashboardId: fileType === 'dashboard' ? fileId : undefined,
      });
    }
  );

  const onFollowUpChat = useMemoizedFn(
    async ({ prompt, chatId }: Pick<NonNullable<StartChatParams>, 'prompt' | 'chatId'>) => {
      return startChat({
        prompt,
        chatId,
      });
    }
  );

  const onStopChat = useMemoizedFn(({ chatId }: { chatId: string }) => {
    stopChatMutation(chatId);
  });

  const onReplaceMessageInChat = useMemoizedFn(
    async ({
      prompt,
      messageId,
      chatId,
    }: {
      prompt: string;
      messageId: string;
      chatId: string;
    }) => {
      const currentChat = getChatMemoized(chatId);
      const currentMessage = getChatMessageMemoized(messageId);
      const currentRequestMessage = currentMessage?.request_message;
      if (!currentRequestMessage) return;

      const messageIndex = currentChat?.message_ids.indexOf(messageId);

      onUpdateChatMessage({
        id: messageId,
        request_message: create(currentRequestMessage, (draft) => {
          draft.request = prompt;
        }),
        reasoning_message_ids: [],
        response_message_ids: [],
        reasoning_messages: {},
        final_reasoning_message: null,
      });

      if (messageIndex !== -1 && typeof messageIndex === 'number') {
        const updatedMessageIds = currentChat?.message_ids.slice(0, messageIndex + 1);
        onUpdateChat({
          id: chatId,
          message_ids: updatedMessageIds,
        });
      }

      return startChat({
        prompt,
        messageId,
      });
    }
  );

  return {
    onStartNewChat,
    onStartChatFromFile,
    onFollowUpChat,
    onStopChat,
    onReplaceMessageInChat,
    isSubmittingChat,
  };
};
