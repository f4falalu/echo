import React, { useMemo } from 'react';
import type { BusterChatMessageResponse } from '@/api/buster_socket/chats';
import { MessageContainer } from '../MessageContainer';
import { AnimatePresence, motion } from 'framer-motion';
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

    const animationConfig = {
      initial: { opacity: 1, height: 'auto' },
      exit: { opacity: 0, height: 0 },
      layout: true,
      transition: {
        opacity: { duration: 0.2 },
        height: { duration: 0.2 },
        layout: { duration: 0.2 }
      }
    };

    return (
      <MessageContainer className="flex w-full flex-col overflow-hidden">
        <AnimatePresence mode="sync" initial={false}>
          {responseMessages.map((responseMessage, index) => (
            <motion.div
              key={getKey(responseMessage)}
              initial={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              layout
              transition={{
                opacity: { duration: 0.2 },
                height: { duration: 0.2 },
                layout: { duration: 0.2 }
              }}>
              <ChatResponseMessageSelector
                key={getKey(responseMessage)}
                responseMessage={responseMessage}
                isCompletedStream={isCompletedStream}
                isLastMessageItem={index === lastMessageIndex}
                selectedFileId={selectedFileId}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </MessageContainer>
    );
  }
);
