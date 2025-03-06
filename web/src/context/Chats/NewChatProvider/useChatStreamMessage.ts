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

  const initializeOrUpdateMessage = useMemoizedFn(
    (messageId: string, updateFn: (draft: IBusterChatMessage) => void) => {
      const currentMessage = chatRefMessages.current[messageId];
      const updatedMessage = create(currentMessage || {}, (draft) => {
        updateFn(draft);
      });
      chatRefMessages.current[messageId] = updatedMessage;
      onUpdateChatMessage(updatedMessage);
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
    const { chat_id, title, title_chunk, progress } = newData;
    const isCompleted = progress === 'completed';
    const currentTitle = chatRef.current[chat_id]?.title || '';
    const newTitle = isCompleted ? title : currentTitle + title_chunk;
    chatRef.current = create(chatRef.current, (draft) => {
      if (newTitle) draft[chat_id].title = newTitle;
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
      const existingMessage =
        chatRefMessages.current[message_id]?.response_messages?.[responseMessageId];
      const isNewMessage = !existingMessage;

      if (isNewMessage) {
        initializeOrUpdateMessage(message_id, (draft) => {
          if (!draft.response_messages) {
            draft.response_messages = {};
          }
          draft.response_messages[responseMessageId] = response_message;
          if (!draft.response_message_ids) {
            draft.response_message_ids = [];
          }
          draft.response_message_ids.push(responseMessageId);
        });
      }

      if (response_message.type === 'text') {
        const existingResponseMessageText = existingMessage as BusterChatResponseMessage_text;
        const isStreaming =
          response_message.message_chunk !== undefined && response_message.message_chunk !== null;

        initializeOrUpdateMessage(message_id, (draft) => {
          const responseMessage = draft.response_messages?.[responseMessageId];
          if (!responseMessage) return;
          const messageText = responseMessage as BusterChatMessageReasoning_text;
          Object.assign(messageText, {
            ...existingResponseMessageText,
            ...response_message,
            message: isStreaming
              ? (existingResponseMessageText?.message || '') +
                (response_message.message_chunk || '')
              : response_message.message
          });
        });
      }

      const currentMessage = chatRefMessages.current[message_id];
      onUpdateChatMessageTransition({
        id: message_id,
        response_messages: currentMessage?.response_messages,
        response_message_ids: currentMessage?.response_message_ids
      });
    }
  );

  const _generatingReasoningMessageCallback = useMemoizedFn(
    (_: null, d: ChatEvent_GeneratingReasoningMessage) => {
      const { message_id, reasoning, chat_id } = d;

      const reasoningMessageId = reasoning.id;
      const existingMessage =
        chatRefMessages.current[message_id]?.reasoning_messages?.[reasoningMessageId];
      const isNewMessage = !existingMessage;

      if (isNewMessage) {
        initializeOrUpdateMessage(message_id, (draft) => {
          if (!draft.reasoning_messages) {
            draft.reasoning_messages = {};
          }
          draft.reasoning_messages[reasoningMessageId] = reasoning;
          if (!draft.reasoning_message_ids) {
            draft.reasoning_message_ids = [];
          }
          draft.reasoning_message_ids.push(reasoningMessageId);
        });
      }

      switch (reasoning.type) {
        case 'text': {
          const existingReasoningMessageText = existingMessage as BusterChatMessageReasoning_text;
          const isStreaming =
            reasoning.message_chunk !== null || reasoning.message_chunk !== undefined;

          initializeOrUpdateMessage(message_id, (draft) => {
            const reasoningMessage = draft.reasoning_messages?.[reasoningMessageId];
            if (!reasoningMessage) return;
            const messageText = reasoningMessage as BusterChatMessageReasoning_text;

            Object.assign(messageText, {
              ...existingReasoningMessageText,
              ...reasoning,
              message: isStreaming
                ? (existingReasoningMessageText?.message || '') + (reasoning.message_chunk || '')
                : reasoning.message
            });
          });

          break;
        }
        case 'files': {
          const existingReasoningMessageFiles = existingMessage as BusterChatMessageReasoning_files;

          initializeOrUpdateMessage(message_id, (draft) => {
            const reasoningMessage = draft.reasoning_messages?.[reasoningMessageId];
            if (!reasoningMessage) return;

            const messageFiles = create(
              reasoningMessage as BusterChatMessageReasoning_files,
              (draft) => {
                draft.file_ids = existingReasoningMessageFiles?.file_ids || [];

                if (reasoning.status) draft.status = reasoning.status;
                if (reasoning.title) draft.title = reasoning.title;
                if (reasoning.secondary_title) draft.secondary_title = reasoning.secondary_title;

                for (const fileId of reasoning.file_ids) {
                  if (!draft.file_ids.includes(fileId)) {
                    draft.file_ids.push(fileId);
                  }

                  if (!draft.files) {
                    draft.files = {};
                  }

                  if (!draft.files[fileId]) {
                    draft.files[fileId] = {} as BusterChatMessageReasoning_file;
                  }

                  const existingFile = existingReasoningMessageFiles?.files[fileId];
                  const newFile = reasoning.files[fileId];

                  draft.files[fileId] = create(draft.files[fileId], (fileDraft) => {
                    // Merge existing and new file data
                    Object.assign(fileDraft, existingFile || {}, newFile);

                    // Handle file text specifically
                    if (newFile.file) {
                      fileDraft.file = create(fileDraft.file || {}, (fileContentDraft) => {
                        Object.assign(fileContentDraft, existingFile?.file || {});
                        fileContentDraft.text = newFile.file.text_chunk
                          ? (existingFile?.file?.text || '') + newFile.file.text_chunk
                          : (newFile.file.text ?? existingFile?.file?.text);
                        fileContentDraft.modified =
                          newFile.file.modified ?? existingFile?.file?.modified;
                      });
                    }
                  });
                }
              }
            );

            draft.reasoning_messages[reasoningMessageId] = messageFiles;
          });
          break;
        }
        case 'pills': {
          initializeOrUpdateMessage(message_id, (draft) => {
            if (!draft.reasoning_messages?.[reasoningMessageId]) return;
            draft.reasoning_messages[reasoningMessageId] = reasoning;
          });

          break;
        }
        default: {
          const type: never = reasoning;
          break;
        }
      }

      const currentMessage = chatRefMessages.current[message_id];
      onUpdateChatMessageTransition({
        id: message_id,
        reasoning_messages: currentMessage?.reasoning_messages,
        reasoning_message_ids: currentMessage?.reasoning_message_ids,
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
