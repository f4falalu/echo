import { useNavigate } from '@tanstack/react-router';
import type { FileType } from '@/api/asset_interfaces/chat';
import { useStartNewChat, useStopChat } from '@/api/buster_rest/chats/queryRequestsV2';
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

  return {
    onStartNewChat,
    onStartChatFromFile,
    onFollowUpChat,
    onStopChat,
    isSubmittingChat,
  };
};
