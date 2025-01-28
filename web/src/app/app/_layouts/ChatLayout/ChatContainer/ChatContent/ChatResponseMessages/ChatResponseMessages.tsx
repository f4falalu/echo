import React, { useEffect, useRef, useState } from 'react';
import type { BusterChatMessage_text, BusterChatMessageResponse } from '@/api/buster_socket/chats';
import { MessageContainer } from '../MessageContainer';
import { ChatResponseMessage_File } from './ChatResponseMessage_File';
import { ChatResponseMessage_Text } from './ChatResponseMessage_Text';
import { ChatResponseMessage_Thought } from './ChatResponseMessage_Thought';
import { useHotkeys } from 'react-hotkeys-hook';
import { faker } from '@faker-js/faker';

export interface ChatResponseMessageProps {
  responseMessage: BusterChatMessageResponse;
  isCompletedStream: boolean;
}

const ChatResponseMessageRecord: Record<
  BusterChatMessageResponse['type'],
  React.FC<ChatResponseMessageProps>
> = {
  text: ChatResponseMessage_Text,
  file: ChatResponseMessage_File,
  thought: ChatResponseMessage_Thought
};

interface ChatResponseMessagesProps {
  responseMessages: BusterChatMessageResponse[];
  isCompletedStream: boolean;
}

export const ChatResponseMessages: React.FC<ChatResponseMessagesProps> = React.memo(
  ({ responseMessages, isCompletedStream }) => {
    //  const [testMessages, setMessages] = useState<BusterChatMessageResponse[]>(responseMessages);
    // const replicaOfMessages = useRef<string>('');

    // useEffect(() => {
    //   setMessages(responseMessages);
    //   replicaOfMessages.current =
    //     (responseMessages as BusterChatMessage_text[])[0]?.message ||
    //     (responseMessages as BusterChatMessage_text[])[0]?.message_chunk ||
    //     '';
    // }, [responseMessages]);

    // const firstMessageId = testMessages[0]?.id;
    // useHotkeys('x', () => {
    //   const threeRandomWords = ' ' + faker.lorem.words(6) + ' swag';
    //   setMessages((prevMessages) => {
    //     return prevMessages.map((message) => {
    //       if (message.id === firstMessageId) {
    //         replicaOfMessages.current = replicaOfMessages.current + threeRandomWords;
    //         return {
    //           ...message,
    //           message_chunk: threeRandomWords
    //         };
    //       }
    //       return message;
    //     });
    //   });
    // });

    // useHotkeys('z', () => {
    //   setMessages((prevMessages) => {
    //     return prevMessages.map((message) => {
    //       if (message.id === firstMessageId) {
    //         return { ...message, message: replicaOfMessages.current };
    //       }

    //       return message;
    //     });
    //   });
    // });

    return (
      <MessageContainer>
        {responseMessages.map((responseMessage) => {
          const ChatResponseMessage = ChatResponseMessageRecord[responseMessage.type];
          return (
            <ChatResponseMessage
              key={responseMessage.id}
              responseMessage={responseMessage}
              isCompletedStream={isCompletedStream}
            />
          );
        })}
      </MessageContainer>
    );
  }
);

ChatResponseMessages.displayName = 'ChatResponseMessages';
