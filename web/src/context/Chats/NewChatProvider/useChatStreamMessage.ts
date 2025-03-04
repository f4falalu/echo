import { useMemoizedFn } from 'ahooks';
import { useBusterChatContextSelector } from '../ChatProvider';
import {
  BusterChat,
  BusterChatMessage_text,
  BusterChatMessageReasoning,
  BusterChatMessageReasoning_files,
  BusterChatMessageReasoning_text,
  BusterChatMessageReasoning_Pills
} from '@/api/asset_interfaces';
import {
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
  Record<string, ChatMessageResponseMessage> | undefined
>;

type ChatMessageReasoningMessageRef = Record<
  //message_id
  string,
  //reasoning_message_id
  Record<string, ChatMessageReasoning> | undefined
>;

export const useChatStreamMessage = () => {
  const queryClient = useQueryClient();
  const getChatMessage = useBusterChatContextSelector((x) => x.getChatMessageMemoized);
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const onUpdateChat = useBusterChatContextSelector((x) => x.onUpdateChat);
  const onUpdateChatMessage = useBusterChatContextSelector((x) => x.onUpdateChatMessage);
  const [isPending, startTransition] = useTransition();

  const onUpdateChatMessageTransition = useMemoizedFn(
    (iChatMessage: Parameters<typeof onUpdateChatMessage>[0]) => {
      startTransition(() => {
        onUpdateChatMessage(iChatMessage);
      });
    }
  );

  /*
  We need to use refs here because events stream back faster than the query client can update the data. 
  So we need to store the data in a ref and then update the query client when the data is updated.
  */
  const chatMessageResponseMessagesRef = useRef<ChatMessageResponseMessagesRef>({});
  const chatMessageReasoningMessageRef = useRef<ChatMessageReasoningMessageRef>({});
  const chatMessagesRef = useRef<Record<string, Partial<IBusterChatMessage>>>({});
  const chatRef = useRef<Record<string, Partial<IBusterChat>>>({});

  const { autoAppendThought } = useAutoAppendThought();

  const normalizeChatMessage = useMemoizedFn((iChatMessages: IBusterChatMessage[]) => {
    for (const message of iChatMessages) {
      const options = queryKeys.chatsMessages(message.id);
      const queryKey = options.queryKey;
      queryClient.setQueryData(queryKey, message);
    }
  });

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

  const _generatingResponseMessageCallback = useMemoizedFn(
    (_: null, d: ChatEvent_GeneratingResponseMessage) => {
      const { message_id, response_message, chat_id } = d;

      if (!response_message?.id) return;

      const responseMessageId = response_message.id;
      const foundResponseMessage: undefined | ChatMessageResponseMessage =
        chatMessageResponseMessagesRef.current[message_id]?.[responseMessageId];
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
        chatMessageResponseMessagesRef.current[message_id] = {
          ...(chatMessageResponseMessagesRef.current[message_id] || {}),
          [responseMessageId]: {
            ...response_message,
            index: currentResponseMessages.length
          }
        };
      }

      const messageToUse = chatMessageResponseMessagesRef.current[message_id]?.[responseMessageId]!;

      onUpdateChatMessageTransition({
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

  const _generatingReasoningMessageCallback = useMemoizedFn(
    (_: null, d: ChatEvent_GeneratingReasoningMessage) => {
      const { message_id, reasoning, chat_id } = d;
      const reasoningMessageId = reasoning.id;
      let messageToUse: undefined | ChatMessageReasoning =
        chatMessageReasoningMessageRef.current[message_id]?.[reasoningMessageId];
      const isNewMessage = !messageToUse;
      const currentReasoning = chatMessagesRef.current[message_id]?.reasoning ?? [];

      if (isNewMessage) {
        chatMessageReasoningMessageRef.current[message_id] = {
          ...chatMessageReasoningMessageRef.current[message_id],
          [reasoningMessageId]: {
            ...reasoning,
            index: currentReasoning.length
          }
        };
        messageToUse = chatMessageReasoningMessageRef.current[message_id]?.[reasoningMessageId]!;
      }

      switch (reasoning.type) {
        case 'text':
          const existingReasoningMessageText = messageToUse as BusterChatMessageReasoning_text;
          const isStreaming = reasoning.message_chunk !== null;
          if (isStreaming) {
            existingReasoningMessageText.message =
              (existingReasoningMessageText.message || '') + reasoning.message_chunk!;
          }

          console.log(existingReasoningMessageText.message?.length);

          break;
        case 'files':
          const existingReasoningMessageFiles = messageToUse as BusterChatMessageReasoning_files;

          const updatedFiles = reasoning.files.reduce(
            (acc, newFile) => {
              const existingFile = acc.find((f) => f.file_name === newFile.file_name);
              if (existingFile) {
                // Update existing file with new content
                if (existingFile.file && newFile.file) {
                  existingFile.file =
                    Array.isArray(existingFile.file) && Array.isArray(newFile.file)
                      ? [...existingFile.file, ...newFile.file]
                      : existingFile.file;
                }
              } else {
                // Add new file
                acc.push(newFile);
              }
              return acc;
            },
            [...existingReasoningMessageFiles.files]
          );

          reasoning.files = updatedFiles;
          break;
        case 'pills':
          const existingReasoningMessagePills = messageToUse as BusterChatMessageReasoning_Pills;

          // Handle pill containers
          if (reasoning.pill_containers) {
            const updatedContainers = reasoning.pill_containers.reduce(
              (acc, newContainer) => {
                const existingContainer = acc.find((c) => c.title === newContainer.title);

                if (existingContainer) {
                  // Update existing container by merging pills
                  existingContainer.pills = [...existingContainer.pills, ...newContainer.pills];
                } else {
                  // Add new container
                  acc.push(newContainer);
                }

                return acc;
              },
              [...(existingReasoningMessagePills.pill_containers || [])]
            );

            reasoning.pill_containers = updatedContainers;
          }
          break;
        default:
          const type: never = reasoning;
          break;
      }

      if (!messageToUse) return;

      const updatedReasoning: BusterChatMessageReasoning[] = isNewMessage
        ? [...currentReasoning, messageToUse]
        : [
            ...currentReasoning.slice(0, messageToUse.index),
            messageToUse,
            ...currentReasoning.slice(messageToUse.index + 1)
          ];

      onUpdateChatMessageTransition({
        id: message_id,
        reasoning: autoAppendThought(updatedReasoning, chat_id),
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
