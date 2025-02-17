import { useMemoizedFn } from 'ahooks';
import { useBusterChatContextSelector } from '../ChatProvider';
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
import { useSocketQueryOn } from '@/api/buster_socket_query';
import { useRef } from 'react';
import { IBusterChat, IBusterChatMessage } from '../interfaces';

type ChatMessageResponseMessage = IBusterChatMessage['response_messages'][number] & {
  index: number;
};
type ChatMessageReasoning = IBusterChatMessage['reasoning'][number] & {
  index: number;
};

type ChatMessageResponseMessagesRef = Record<
  //message_id
  string,
  //response_message_id
  Record<string, ChatMessageResponseMessage>
>;

type ChatMessageReasoningMessageRef = Record<
  //message_id
  string,
  //reasoning_message_id
  Record<string, ChatMessageReasoning>
>;

export const useChatStreamMessage = () => {
  // const busterSocket = useBusterWebSocket();
  const getChatMessage = useBusterChatContextSelector((x) => x.getChatMessageMemoized);
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const onUpdateChat = useBusterChatContextSelector((x) => x.onUpdateChat);
  const onUpdateChatMessage = useBusterChatContextSelector((x) => x.onUpdateChatMessage);
  const onToggleChatsModal = useAppLayoutContextSelector((s) => s.onToggleChatsModal);
  const chatMessageResponseMessagesRef = useRef<ChatMessageResponseMessagesRef>({});
  const chatMessageReasoningMessageRef = useRef<ChatMessageReasoningMessageRef>({});
  const chatMessagesRef = useRef<Record<string, Partial<IBusterChatMessage>>>({});
  const chatRef = useRef<Record<string, Partial<IBusterChat>>>({});

  const { autoAppendThought } = useAutoAppendThought();

  const completeChatCallback = useMemoizedFn((d: BusterChat) => {
    const { iChat, iChatMessages } = updateChatToIChat(d, false);
    //  onBulkSetChatMessages(iChatMessages);
    onUpdateChat(iChat);
  });

  const stopChatCallback = useMemoizedFn((chatId: string) => {
    onUpdateChatMessage({
      id: chatId,
      isCompletedStream: true
    });
  });

  const initializeNewChatCallback = useMemoizedFn((d: BusterChat) => {
    const { iChat, iChatMessages } = updateChatToIChat(d, true);
    //onBulkSetChatMessages(iChatMessages);
    onUpdateChat(iChat);
    onChangePage({
      route: BusterRoutes.APP_CHAT_ID,
      chatId: iChat.id
    });
    onToggleChatsModal(false);
  });

  const replaceMessageCallback = useMemoizedFn(
    ({ prompt, messageId }: { prompt: string; messageId: string }) => {
      const currentMessage = getChatMessage(messageId);
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

  const _generatingTitleCallback = useMemoizedFn((_: null, newData: ChatEvent_GeneratingTitle) => {
    const { chat_id, title, title_chunk, progress } = newData;
    const isCompleted = progress === 'completed';
    const currentTitle = chatRef.current[chat_id]?.title || '';
    const newTitle = isCompleted ? title : currentTitle + title_chunk;
    chatRef.current[chat_id] = {
      ...chatRef.current[chat_id],
      title: newTitle
    };
    onUpdateChat({
      id: chat_id,
      title: newTitle
    });
  });

  useSocketQueryOn({
    socketResponse: '/chats/post:generatingTitle',
    callback: _generatingTitleCallback
  });

  const _generatingResponseMessageCallback = useMemoizedFn(
    (_: null, d: ChatEvent_GeneratingResponseMessage) => {
      const { message_id, response_message, chat_id } = d;
      const responseMessageId = response_message.id;
      const foundResponseMessage: undefined | ChatMessageResponseMessage =
        chatMessageResponseMessagesRef.current[message_id][responseMessageId];
      const isNewMessage = !foundResponseMessage;
      const currentResponseMessages = chatMessagesRef.current[message_id]?.response_messages ?? [];

      if (response_message.type === 'text') {
        const existingMessage = (foundResponseMessage as BusterChatMessage_text)?.message || '';
        const isStreaming = !!response_message.message_chunk;
        if (isStreaming) {
          response_message.message = existingMessage + response_message.message_chunk;
        }
      }

      if (isNewMessage) {
        chatMessageResponseMessagesRef.current[message_id][responseMessageId] = {
          ...response_message,
          index: currentResponseMessages.length
        };
      }

      const messageToUse = chatMessageResponseMessagesRef.current[message_id][responseMessageId];

      onUpdateChatMessage({
        id: message_id,
        response_messages: isNewMessage
          ? [...currentResponseMessages, messageToUse]
          : [
              ...currentResponseMessages.slice(0, messageToUse.index),
              messageToUse,
              ...currentResponseMessages.slice(messageToUse.index + 1)
            ]
      });
    }
  );

  useSocketQueryOn({
    socketResponse: '/chats/post:generatingResponseMessage',
    callback: _generatingResponseMessageCallback
  });

  const _generatingReasoningMessageCallback = useMemoizedFn(
    (_: null, d: ChatEvent_GeneratingReasoningMessage) => {
      const { message_id, reasoning, chat_id } = d;
      const reasoningMessageId = reasoning.id;
      const foundReasoningMessage: undefined | ChatMessageReasoning =
        chatMessageReasoningMessageRef.current[message_id][reasoningMessageId];
      const isNewMessage = !foundReasoningMessage;
      const currentReasoning = chatMessagesRef.current[message_id]?.reasoning ?? [];

      if (isNewMessage) {
        chatMessageReasoningMessageRef.current[message_id][reasoningMessageId] = {
          ...reasoning,
          index: currentReasoning.length
        };
      }

      const messageToUse = chatMessageReasoningMessageRef.current[message_id][reasoningMessageId];

      const updatedReasoning = isNewMessage
        ? [...currentReasoning, messageToUse]
        : [
            ...currentReasoning.slice(0, foundReasoningMessage.index),
            reasoning,
            ...currentReasoning.slice(foundReasoningMessage.index + 1)
          ];

      onUpdateChatMessage({
        id: message_id,
        reasoning: autoAppendThought(updatedReasoning, chat_id),
        isCompletedStream: false
      });
    }
  );

  useSocketQueryOn({
    socketResponse: '/chats/post:generatingReasoningMessage',
    callback: _generatingReasoningMessageCallback
  });

  return {
    initializeNewChatCallback,
    completeChatCallback,
    stopChatCallback,
    replaceMessageCallback
  };
};
