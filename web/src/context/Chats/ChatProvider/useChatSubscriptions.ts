import { MutableRefObject } from 'react';
import { useBusterWebSocket } from '../../BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import {
  BusterChat,
  BusterChatMessage,
  BusterChatMessageReasoning_thought,
  BusterChatMessageReasoning_file
} from '@/api/asset_interfaces';
import { IBusterChat, IBusterChatMessage } from '../interfaces';
import { chatMessageUpgrader, chatUpgrader } from './helpers';
import {
  createMockResponseMessageFile,
  createMockResponseMessageText,
  createMockResponseMessageThought,
  MOCK_CHAT
} from './MOCK_CHAT';
import { useHotkeys } from 'react-hotkeys-hook';
import { faker } from '@faker-js/faker';
export const useChatSubscriptions = ({
  chatsRef,
  chatsMessagesRef,
  startTransition
}: {
  chatsRef: MutableRefObject<Record<string, IBusterChat>>;
  chatsMessagesRef: MutableRefObject<Record<string, IBusterChatMessage>>;
  startTransition: (fn: () => void) => void;
}) => {
  const busterSocket = useBusterWebSocket();

  const _onGetChat = useMemoizedFn((chat: BusterChat): IBusterChat => {
    const upgradedChat = chatUpgrader(chat);
    const upgradedChatMessages = chatMessageUpgrader(chat.messages);
    chatsRef.current[chat.id] = upgradedChat;
    chatsMessagesRef.current = {
      ...chatsMessagesRef.current,
      ...upgradedChatMessages
    };
    startTransition(() => {
      //just used to trigger UI update
    });
    return upgradedChat;
  });

  const unsubscribeFromChat = useMemoizedFn(({ chatId }: { chatId: string }) => {
    return busterSocket.emit({
      route: '/chats/unsubscribe',
      payload: {
        id: chatId
      }
    });
  });

  const subscribeToChat = useMemoizedFn(({ chatId }: { chatId: string }) => {
    _onGetChat(MOCK_CHAT);
    // return busterSocket.emitAndOnce({
    //   emitEvent: {
    //     route: '/chats/get',
    //     payload: { id: chatId }
    //   },
    //   responseEvent: {
    //     route: '/chats/get:getChat',
    //     callback: _onGetChat
    //   }
    // });
  });

  useHotkeys('f', () => {
    // Find the last chat message
    const lastChatId = Object.keys(chatsRef.current)[Object.keys(chatsRef.current).length - 1];
    const lastChat = chatsRef.current[lastChatId];

    if (!lastChat?.messages?.length) return;

    const lastMessageId = lastChat.messages[lastChat.messages.length - 1];
    const lastMessage = chatsMessagesRef.current[lastMessageId];

    if (!lastMessage?.reasoning?.length) return;

    // Find the last reasoning file message
    const lastReasoningFile = lastMessage.reasoning
      .filter((r: { type: string }) => r.type === 'file')
      .pop() as BusterChatMessageReasoning_file | undefined;

    if (!lastReasoningFile) return;

    // Create new file chunk
    const newChunk = {
      text: faker.lorem.sentence(),
      line_number: (lastReasoningFile.file?.length || 0) + 1,
      modified: true
    };

    // Create new reasoning file with updated chunks
    const updatedReasoningFile = {
      ...lastReasoningFile,
      file_chunk: [newChunk]
    };

    // Create new message with updated reasoning array
    const updatedMessage = {
      ...lastMessage,
      reasoning: lastMessage.reasoning.map((r) => {
        if (r.type === 'file' && r.id === lastReasoningFile.id) {
          return updatedReasoningFile;
        }
        return r;
      })
    };

    // Update the refs with new object references
    chatsMessagesRef.current = {
      ...chatsMessagesRef.current,
      [lastMessageId]: updatedMessage
    };

    chatsRef.current = {
      ...chatsRef.current,
      [lastChatId]: {
        ...lastChat,
        messages: [...lastChat.messages]
      }
    };

    startTransition(() => {
      // Force a re-render
      chatsRef.current = { ...chatsRef.current };
      chatsMessagesRef.current = { ...chatsMessagesRef.current };
    });
  });

  return {
    unsubscribeFromChat,
    subscribeToChat
  };
};
