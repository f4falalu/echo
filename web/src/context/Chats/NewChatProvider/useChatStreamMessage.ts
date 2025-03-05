import { useMemoizedFn } from 'ahooks';
import { useBusterChatContextSelector } from '../ChatProvider';
import type {
  BusterChat,
  BusterChatMessageReasoning_files,
  BusterChatMessageReasoning_text,
  BusterChatMessageReasoning_pills,
  BusterChatResponseMessage_text,
  BusterChatMessageResponse,
  BusterChatMessageReasoning_file
} from '@/api/asset_interfaces';
import type {
  ChatEvent_GeneratingReasoningMessage,
  ChatEvent_GeneratingResponseMessage,
  ChatEvent_GeneratingTitle
} from '@/api/buster_socket/chats';
import { updateChatToIChat } from '@/lib/chat';
import { useAutoAppendThought } from './useAutoAppendThought';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { useSocketQueryOn } from '@/api/buster_socket_query';
import { useRef, useTransition } from 'react';
import { IBusterChat, IBusterChatMessage } from '../interfaces';
import { queryKeys } from '@/api/query_keys';
import { useQueryClient } from '@tanstack/react-query';
import { create } from 'mutative';

export const useChatStreamMessage = () => {
  const queryClient = useQueryClient();
  const getChatMessage = useBusterChatContextSelector((x) => x.getChatMessageMemoized);
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const onUpdateChat = useBusterChatContextSelector((x) => x.onUpdateChat);
  const onUpdateChatMessage = useBusterChatContextSelector((x) => x.onUpdateChatMessage);
  const chatRef = useRef<Record<string, Partial<IBusterChat>>>({});
  const [isPending, startTransition] = useTransition();

  const onUpdateChatMessageTransition = useMemoizedFn(
    (chatMessage: Parameters<typeof onUpdateChatMessage>[0], chatId: string) => {
      const currentChatMessage = chatRef.current[chatId]?.messages?.[chatMessage.id];
      const iChatMessage = create(currentChatMessage, (draft) => {
        Object.assign(draft || {}, chatMessage);
      })!;

      onUpdateChatMessage(iChatMessage!);

      console.log(
        chatRef.current[chatId]?.messages?.[chatMessage.id].reasoning_message_ids.length,
        chatRef.current[chatId]?.messages?.[chatMessage.id].response_message_ids.length
      );

      startTransition(() => {
        //
      });
    }
  );

  const { autoAppendThought } = useAutoAppendThought();

  const initializeOrUpdateMessage = useMemoizedFn(
    (
      chatId: string,
      messageId: string,
      updateFn: (draft: Record<string, Partial<IBusterChat>>) => void
    ) => {
      chatRef.current = create(chatRef.current, (draft) => {
        if (!draft[chatId]) draft[chatId] = {};
        if (!draft[chatId].messages) draft[chatId].messages = {};
        if (!draft[chatId].messages[messageId]) {
          draft[chatId].messages[messageId] = {
            id: messageId,
            request_message: null,
            response_message_ids: [],
            response_messages: {},
            reasoning_message_ids: [],
            reasoning_messages: {},
            created_at: new Date().toISOString(),
            final_reasoning_message: null
          };
        }

        updateFn(draft);
      });
    }
  );

  const normalizeChatMessage = useMemoizedFn(
    (iChatMessages: Record<string, IBusterChatMessage>) => {
      for (const message of Object.values(iChatMessages)) {
        const options = queryKeys.chatsMessages(message.id);
        const queryKey = options.queryKey;
        queryClient.setQueryData(queryKey, message);
      }
    }
  );

  const completeChatCallback = useMemoizedFn((d: BusterChat) => {
    const { iChat, iChatMessages } = updateChatToIChat(d, false);
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
    const { chat_id, title, title_chunk, progress } = newData;
    const isCompleted = progress === 'completed';
    const currentTitle = chatRef.current[chat_id]?.title || '';
    const newTitle = isCompleted ? title : currentTitle + title_chunk;
    chatRef.current = create(chatRef.current, (draft) => {
      if (!draft[chat_id]) draft[chat_id] = {};
      draft[chat_id].title = newTitle;
    });
    onUpdateChat({
      id: chat_id,
      title: newTitle
    });
  });

  const _generatingResponseMessageCallback = useMemoizedFn(
    (_: null, d: ChatEvent_GeneratingResponseMessage) => {
      const { message_id, response_message, chat_id } = d;

      if (!response_message?.id) return;

      const responseMessageId = response_message.id;
      const foundResponseMessage: BusterChatMessageResponse | undefined =
        chatRef.current[chat_id]?.messages?.[message_id]?.response_messages?.[responseMessageId];
      const isNewMessage = !foundResponseMessage;

      if (response_message.type === 'text') {
        const existingMessage =
          (foundResponseMessage as BusterChatResponseMessage_text)?.message || '';
        const isStreaming =
          response_message.message_chunk !== undefined || response_message.message_chunk !== null;
        if (isStreaming) {
          response_message.message = existingMessage + response_message.message_chunk;
        }
      }

      if (isNewMessage) {
        initializeOrUpdateMessage(chat_id, message_id, (draft) => {
          const chat = draft[chat_id];
          if (!chat?.messages?.[message_id]) return;
          if (!chat.messages[message_id].response_messages)
            chat.messages[message_id].response_messages = {};
          chat.messages[message_id].response_messages[responseMessageId] = response_message;
          chat.messages[message_id].response_message_ids.push(responseMessageId);
        });
      }

      const response_messages = chatRef.current[chat_id]?.messages?.[message_id]?.response_messages;
      const response_message_ids =
        chatRef.current[chat_id]?.messages?.[message_id]?.response_message_ids;

      onUpdateChatMessageTransition(
        {
          id: message_id,
          response_messages,
          response_message_ids
        },
        chat_id
      );
    }
  );

  const _generatingReasoningMessageCallback = useMemoizedFn(
    (_: null, d: ChatEvent_GeneratingReasoningMessage) => {
      const { message_id, reasoning, chat_id } = d;
      if (!reasoning?.id) {
        console.log(d);
      }
      const reasoningMessageId = reasoning.id;
      const existingMessage =
        chatRef.current[chat_id]?.messages?.[message_id]?.reasoning_messages?.[reasoningMessageId];
      const isNewMessage = !existingMessage;

      if (isNewMessage) {
        initializeOrUpdateMessage(chat_id, message_id, (draft) => {
          const chat = draft[chat_id];
          if (!chat?.messages?.[message_id]) return;
          if (!chat.messages[message_id].reasoning_messages)
            chat.messages[message_id].reasoning_messages = {};
          chat.messages[message_id].reasoning_messages[reasoningMessageId] = reasoning;
          chat.messages[message_id].reasoning_message_ids.push(reasoningMessageId);
        });
      }

      switch (reasoning.type) {
        case 'text': {
          const existingReasoningMessageText = existingMessage as BusterChatMessageReasoning_text;
          const isStreaming =
            reasoning.message_chunk !== null || reasoning.message_chunk !== undefined;

          initializeOrUpdateMessage(chat_id, message_id, (draft) => {
            const chat = draft[chat_id];
            if (!chat?.messages?.[message_id]?.reasoning_messages?.[reasoningMessageId]) return;
            const messageText = chat.messages[message_id].reasoning_messages[
              reasoningMessageId
            ] as BusterChatMessageReasoning_text;
            Object.assign(messageText, existingReasoningMessageText);
            messageText.message = isStreaming
              ? (existingReasoningMessageText?.message || '') + (reasoning.message_chunk || '')
              : reasoning.message;
          });

          break;
        }
        case 'files': {
          const existingReasoningMessageFiles = existingMessage as BusterChatMessageReasoning_files;

          initializeOrUpdateMessage(chat_id, message_id, (draft) => {
            const chat = draft[chat_id];
            if (!chat?.messages?.[message_id]?.reasoning_messages?.[reasoningMessageId]) return;
            const messageFiles = chat.messages[message_id].reasoning_messages[
              reasoningMessageId
            ] as BusterChatMessageReasoning_files;
            messageFiles.file_ids = existingReasoningMessageFiles?.file_ids || [];

            for (const fileId of reasoning.file_ids) {
              if (!messageFiles.files[fileId]) {
                messageFiles.files[fileId] = {} as BusterChatMessageReasoning_file;
                messageFiles.file_ids.push(fileId);
              }

              const existingFile = existingReasoningMessageFiles?.files[fileId];
              const newFile = reasoning.files[fileId];

              if (existingFile) {
                Object.assign(messageFiles.files[fileId], existingFile);
              }

              if (existingFile?.file && newFile.file) {
                messageFiles.files[fileId].file = {
                  ...existingFile.file,
                  text: newFile.file.text_chunk
                    ? (existingFile.file.text || '') + newFile.file.text_chunk
                    : (newFile.file.text ?? existingFile.file.text),
                  modified: newFile.file.modified ?? existingFile.file.modified
                };
              } else {
                Object.assign(messageFiles.files[fileId], newFile);
              }
            }
          });
          break;
        }
        case 'pills': {
          const existingReasoningMessagePills = existingMessage as BusterChatMessageReasoning_pills;

          initializeOrUpdateMessage(chat_id, message_id, (draft) => {
            const chat = draft[chat_id];
            if (!chat?.messages?.[message_id]?.reasoning_messages?.[reasoningMessageId]) return;
            const messagePills = chat.messages[message_id].reasoning_messages[
              reasoningMessageId
            ] as BusterChatMessageReasoning_pills;
            Object.assign(messagePills, existingReasoningMessagePills);
            messagePills.pill_containers = [];

            if (reasoning.pill_containers) {
              for (const newContainer of reasoning.pill_containers) {
                const existingContainerIndex =
                  existingReasoningMessagePills.pill_containers?.findIndex(
                    (c) => c.title === newContainer.title
                  ) ?? -1;

                if (
                  existingContainerIndex !== -1 &&
                  existingReasoningMessagePills.pill_containers
                ) {
                  const container = {} as typeof newContainer;
                  Object.assign(
                    container,
                    existingReasoningMessagePills.pill_containers[existingContainerIndex]
                  );
                  container.pills = [];
                  container.pills.push(
                    ...existingReasoningMessagePills.pill_containers[existingContainerIndex].pills
                  );
                  container.pills.push(...newContainer.pills);
                  messagePills.pill_containers.push(container);
                } else {
                  messagePills.pill_containers.push(newContainer);
                }
              }
            }
          });
          break;
        }
        default: {
          const type: never = reasoning;
          break;
        }
      }

      const reasoning_messages =
        chatRef.current[chat_id]?.messages?.[message_id]?.reasoning_messages;
      const reasoning_message_ids =
        chatRef.current[chat_id]?.messages?.[message_id]?.reasoning_message_ids;

      onUpdateChatMessageTransition(
        {
          id: message_id,
          reasoning_messages,
          reasoning_message_ids,
          isCompletedStream: false
        },
        chat_id
      );
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
