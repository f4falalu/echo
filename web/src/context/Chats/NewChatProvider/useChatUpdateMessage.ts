import { useMemoizedFn } from 'ahooks';
import { useBusterChatContextSelector } from '../ChatProvider';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { BusterChat, BusterChatMessage_text } from '@/api/asset_interfaces';
import {
  ChatEvent_GeneratingReasoningMessage,
  ChatEvent_GeneratingResponseMessage,
  ChatEvent_GeneratingTitle
} from '@/api/buster_socket/chats';
import { updateChatToIChat } from '@/utils/chat';
import { useAutoAppendThought } from './useAutoAppendThought';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import last from 'lodash/last';

export const useChatUpdateMessage = () => {
  const busterSocket = useBusterWebSocket();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const onUpdateChat = useBusterChatContextSelector((x) => x.onUpdateChat);
  const getChatMemoized = useBusterChatContextSelector((x) => x.getChatMemoized);
  const onUpdateChatMessage = useBusterChatContextSelector((x) => x.onUpdateChatMessage);
  const getChatMessageMemoized = useBusterChatContextSelector((x) => x.getChatMessageMemoized);
  const onBulkSetChatMessages = useBusterChatContextSelector((x) => x.onBulkSetChatMessages);
  const onToggleChatsModal = useAppLayoutContextSelector((s) => s.onToggleChatsModal);

  const { autoAppendThought } = useAutoAppendThought();

  const _generatingTitleCallback = useMemoizedFn((d: ChatEvent_GeneratingTitle) => {
    const { chat_id, title, title_chunk } = d;
    const isCompleted = d.progress === 'completed';
    const currentChat = getChatMemoized(chat_id)!;
    const currentTitle = currentChat?.title;
    const newTitle = isCompleted ? title : currentTitle + title_chunk;
    onUpdateChat({
      ...currentChat,
      title: newTitle
    });
  });

  const _generatingResponseMessageCallback = useMemoizedFn(
    (d: ChatEvent_GeneratingResponseMessage) => {
      const { message_id, response_message } = d;
      const currentResponseMessages = getChatMessageMemoized(message_id)?.response_messages ?? [];
      const responseMessageId = response_message.id;
      const foundResponseMessage = currentResponseMessages.find(
        ({ id }) => id === responseMessageId
      );
      const isNewMessage = !foundResponseMessage;

      if (response_message.type === 'text') {
        const existingMessage = (foundResponseMessage as BusterChatMessage_text)?.message || '';
        const isStreaming = !!response_message.message_chunk;
        if (isStreaming) {
          response_message.message = existingMessage + response_message.message_chunk;
        }
      }

      onUpdateChatMessage({
        id: message_id,
        response_messages: isNewMessage
          ? [...currentResponseMessages, response_message]
          : currentResponseMessages.map((rm) =>
              rm.id === responseMessageId ? response_message : rm
            )
      });
    }
  );

  const _generatingReasoningMessageCallback = useMemoizedFn(
    (d: ChatEvent_GeneratingReasoningMessage) => {
      const { message_id, reasoning, chat_id } = d;
      const currentReasoning = getChatMessageMemoized(message_id)!.reasoning;
      const isNewMessage = !currentReasoning?.some(({ id }) => id === message_id);
      const updatedReasoning = isNewMessage
        ? [...currentReasoning, reasoning]
        : currentReasoning.map((rm) => (rm.id === message_id ? reasoning : rm));

      onUpdateChatMessage({
        id: message_id,
        reasoning: autoAppendThought(updatedReasoning, chat_id),
        isCompletedStream: false
      });
    }
  );

  const completeChatCallback = useMemoizedFn((d: BusterChat) => {
    const { iChat, iChatMessages } = updateChatToIChat(d, false);
    onBulkSetChatMessages(iChatMessages);
    onUpdateChat(iChat);
  });

  const stopChatCallback = useMemoizedFn((chatId: string) => {
    onUpdateChatMessage({
      id: chatId,
      isCompletedStream: true
    });
  });

  const initializeChatCallback = useMemoizedFn((d: BusterChat) => {
    const { iChat, iChatMessages } = updateChatToIChat(d, true);
    onBulkSetChatMessages(iChatMessages);
    onUpdateChat(iChat);
    onChangePage({
      route: BusterRoutes.APP_CHAT_ID,
      chatId: iChat.id
    });
    onToggleChatsModal(false);
  });

  const replaceMessageCallback = useMemoizedFn(
    ({ prompt, messageId }: { prompt: string; messageId: string }) => {
      const currentMessage = getChatMessageMemoized(messageId);
      const currentRequestMessage = currentMessage?.request_message!;

      onUpdateChatMessage({
        id: messageId,
        request_message: {
          ...currentRequestMessage,
          request: prompt
        },
        reasoning: [],
        response_messages: []
      });
    }
  );

  const listenForGeneratingTitle = useMemoizedFn(() => {
    busterSocket.on({
      route: '/chats/post:generatingTitle',
      callback: _generatingTitleCallback
    });
  });

  const stopListeningForGeneratingTitle = useMemoizedFn(() => {
    busterSocket.off({
      route: '/chats/post:generatingTitle',
      callback: _generatingTitleCallback
    });
  });

  const listenForGeneratingResponseMessage = useMemoizedFn(() => {
    busterSocket.on({
      route: '/chats/post:generatingResponseMessage',
      callback: _generatingResponseMessageCallback
    });
  });

  const stopListeningForGeneratingResponseMessage = useMemoizedFn(() => {
    busterSocket.off({
      route: '/chats/post:generatingResponseMessage',
      callback: _generatingResponseMessageCallback
    });
  });

  const listenForGeneratingReasoningMessage = useMemoizedFn(() => {
    busterSocket.on({
      route: '/chats/post:generatingReasoningMessage',
      callback: _generatingReasoningMessageCallback
    });
  });

  const stopListeningForGeneratingReasoningMessage = useMemoizedFn(() => {
    busterSocket.off({
      route: '/chats/post:generatingReasoningMessage',
      callback: _generatingReasoningMessageCallback
    });
  });

  const startListeningForChatProgress = useMemoizedFn(() => {
    listenForGeneratingTitle();
    listenForGeneratingResponseMessage();
    listenForGeneratingReasoningMessage();
  });

  const stopListeningForChatProgress = useMemoizedFn(() => {
    stopListeningForGeneratingTitle();
    stopListeningForGeneratingResponseMessage();
    stopListeningForGeneratingReasoningMessage();
  });

  return {
    initializeChatCallback,
    completeChatCallback,
    startListeningForChatProgress,
    stopListeningForChatProgress,
    stopChatCallback,
    replaceMessageCallback
  };
};
