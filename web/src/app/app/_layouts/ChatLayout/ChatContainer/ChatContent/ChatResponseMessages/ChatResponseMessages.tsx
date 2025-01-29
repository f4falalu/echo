import React, { useCallback, useMemo } from 'react';
import type { BusterChatMessageResponse } from '@/api/buster_socket/chats';
import { MessageContainer } from '../MessageContainer';
import { ChatResponseMessage_File } from './ChatResponseMessage_File';
import { ChatResponseMessage_Text } from './ChatResponseMessage_Text';
import { ChatResponseMessage_Thought } from './ChatResponseMessage_Thought';
import { AnimatePresence } from 'framer-motion';
import { ChatResponseMessageHidden } from './ChatResponseMessageHidden';
import { useMemoizedFn } from 'ahooks';
import { ChatResponseMessageSelector } from './ChatResponseMessageSelector';

interface ChatResponseMessagesProps {
  responseMessages: BusterChatMessageResponse[];
  selectedFileId: string | undefined;
  isCompletedStream: boolean;
}

type ResponseMessageWithHiddenClusters = BusterChatMessageResponse | BusterChatMessageResponse[];

export const ChatResponseMessages: React.FC<ChatResponseMessagesProps> = React.memo(
  ({ responseMessages: responseMessagesProp, isCompletedStream, selectedFileId }) => {
    const lastMessageIndex = responseMessagesProp.length - 1;

    const responseMessages: ResponseMessageWithHiddenClusters[] = useMemo(() => {
      return responseMessagesProp.reduce<ResponseMessageWithHiddenClusters[]>(
        (acc, responseMessage, index) => {
          const isHidden = responseMessage.hidden;
          const isPreviousHidden = responseMessagesProp[index - 1]?.hidden;
          if (isHidden && isPreviousHidden) {
            const currentCluster = acc[acc.length - 1] as BusterChatMessageResponse[];
            currentCluster.push(responseMessage);
            return acc;
          } else if (isHidden) {
            acc.push([responseMessage]);
            return acc;
          }
          acc.push(responseMessage);
          return acc;
        },
        []
      );
    }, [responseMessagesProp]);

    const getKey = useMemoizedFn((responseMessage: ResponseMessageWithHiddenClusters) => {
      if (Array.isArray(responseMessage)) {
        return responseMessage.map((item) => item.id).join('-');
      }
      return responseMessage.id;
    });

    return (
      <MessageContainer className="flex w-full flex-col overflow-hidden">
        {responseMessages.map((responseMessage, index) => {
          return (
            <ChatResponseMessageSelector
              key={getKey(responseMessage)}
              responseMessage={responseMessage}
              isCompletedStream={isCompletedStream}
              isLastMessageItem={index === lastMessageIndex}
              selectedFileId={selectedFileId}
            />
          );
        })}
      </MessageContainer>
    );
  }
);
