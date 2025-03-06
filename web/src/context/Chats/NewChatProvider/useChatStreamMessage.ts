import { useMemoizedFn } from 'ahooks';
import { useBusterChatContextSelector } from '../ChatProvider';
import type {
  BusterChat,
  BusterChatMessageReasoning_files,
  BusterChatMessageReasoning_text,
  BusterChatResponseMessage_text,
  BusterChatMessageReasoning_file
} from '@/api/asset_interfaces';
import type {
  ChatEvent_GeneratingReasoningMessage,
  ChatEvent_GeneratingResponseMessage,
  ChatEvent_GeneratingTitle
} from '@/api/buster_socket/chats';
import { updateChatToIChat } from '@/lib/chat';
import { useBlackBoxMessage } from './useBlackBoxMessage';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { useSocketQueryOn } from '@/api/buster_socket_query';
import { useRef, useTransition } from 'react';
import { IBusterChat, IBusterChatMessage } from '../interfaces';
import { queryKeys } from '@/api/query_keys';
import { useQueryClient } from '@tanstack/react-query';
import { create } from 'mutative';
import {
  updateChatTitle,
  updateResponseMessage,
  updateReasoningMessage
} from './chatStreamMessageHelper';

export const useChatStreamMessage = () => {
  const queryClient = useQueryClient();
  const getChatMessage = useBusterChatContextSelector((x) => x.getChatMessageMemoized);
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const onUpdateChat = useBusterChatContextSelector((x) => x.onUpdateChat);
  const onUpdateChatMessage = useBusterChatContextSelector((x) => x.onUpdateChatMessage);
  const chatRef = useRef<Record<string, IBusterChat>>({});
  const chatRefMessages = useRef<Record<string, IBusterChatMessage>>({});
  const [isPending, startTransition] = useTransition();

  const { autoAppendThought } = useBlackBoxMessage();

  const onUpdateChatMessageTransition = useMemoizedFn(
    (chatMessage: Parameters<typeof onUpdateChatMessage>[0]) => {
      const currentChatMessage = chatRefMessages.current[chatMessage.id];
      const iChatMessage: IBusterChatMessage = create(currentChatMessage, (draft) => {
        Object.assign(draft || {}, chatMessage);
      })!;

      onUpdateChatMessage(iChatMessage!);

      startTransition(() => {
        //
      });
    }
  );

  const normalizeChatMessage = useMemoizedFn(
    (iChatMessages: Record<string, IBusterChatMessage>) => {
      for (const message of Object.values(iChatMessages)) {
        const options = queryKeys.chatsMessages(message.id);
        const queryKey = options.queryKey;
        queryClient.setQueryData(queryKey, message);
        chatRefMessages.current[message.id] = message;
      }
    }
  );

  const completeChatCallback = useMemoizedFn((d: BusterChat) => {
    const { iChat, iChatMessages } = updateChatToIChat(d, false);
    chatRef.current = create(chatRef.current, (draft) => {
      draft[iChat.id] = iChat;
    });
    normalizeChatMessage(iChatMessages);
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
    chatRef.current = create(chatRef.current, (draft) => {
      draft[iChat.id] = iChat;
    });
    normalizeChatMessage(iChatMessages);
    onUpdateChat(iChat);
    onChangePage({
      route: BusterRoutes.APP_CHAT_ID,
      chatId: iChat.id
    });
  });

  const replaceMessageCallback = useMemoizedFn(
    ({ prompt, messageId }: { prompt: string; messageId: string }) => {
      const currentMessage = getChatMessage(messageId);
      const currentRequestMessage = currentMessage?.request_message!;

      onUpdateChatMessage({
        id: messageId,
        request_message: create(currentRequestMessage, (draft) => {
          draft.request = prompt;
        }),
        reasoning_message_ids: [],
        response_message_ids: []
      });
    }
  );

  const _generatingTitleCallback = useMemoizedFn((_: null, newData: ChatEvent_GeneratingTitle) => {
    const { chat_id } = newData;
    const updatedChat = updateChatTitle(chatRef.current[chat_id], newData);
    chatRef.current[chat_id] = updatedChat;
    onUpdateChat(updatedChat);
  });

  const _generatingResponseMessageCallback = useMemoizedFn(
    (_: null, d: ChatEvent_GeneratingResponseMessage) => {
      const { message_id } = d;
      const updatedMessage = updateResponseMessage(
        message_id,
        chatRefMessages.current[message_id],
        d
      );
      onUpdateChatMessageTransition({
        id: message_id,
        response_messages: updatedMessage?.response_messages,
        response_message_ids: updatedMessage?.response_message_ids
      });
    }
  );

  const _generatingReasoningMessageCallback = useMemoizedFn(
    (_: null, d: ChatEvent_GeneratingReasoningMessage) => {
      const { message_id, reasoning } = d;
      const currentMessage = chatRefMessages.current[message_id];
      const updatedMessage = updateReasoningMessage(message_id, currentMessage, reasoning);

      onUpdateChatMessageTransition({
        id: message_id,
        reasoning_messages: updatedMessage?.reasoning_messages,
        reasoning_message_ids: updatedMessage?.reasoning_message_ids,
        isCompletedStream: false
      });
    }
  );

  useSocketQueryOn({
    responseEvent: '/chats/post:generatingTitle',
    callback: _generatingTitleCallback
  });

  useSocketQueryOn({
    responseEvent: '/chats/post:generatingResponseMessage',
    callback: _generatingResponseMessageCallback
  });

  useSocketQueryOn({
    responseEvent: '/chats/post:generatingReasoningMessage',
    callback: _generatingReasoningMessageCallback
  });

  return {
    initializeNewChatCallback,
    completeChatCallback,
    stopChatCallback,
    replaceMessageCallback
  };
};
