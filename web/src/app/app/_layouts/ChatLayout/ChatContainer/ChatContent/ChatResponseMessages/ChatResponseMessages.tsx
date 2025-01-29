import React, { useMemo } from 'react';
import type { BusterChatMessageResponse } from '@/api/buster_socket/chats';
import { MessageContainer } from '../MessageContainer';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemoizedFn } from 'ahooks';
import { ChatResponseMessageSelector } from './ChatResponseMessageSelector';
import { createStyles } from 'antd-style';

interface ChatResponseMessagesProps {
  responseMessages: BusterChatMessageResponse[];
  selectedFileId: string | undefined;
  isCompletedStream: boolean;
}

type ResponseMessageWithHiddenClusters = BusterChatMessageResponse | BusterChatMessageResponse[];

const animationConfig = {
  initial: { opacity: 1, height: 'auto', marginBottom: '' },
  exit: { opacity: 0, height: 0, marginBottom: 0 },
  layout: true,
  transition: {
    opacity: { duration: 0.2 },
    height: { duration: 0.2 },
    marginBottom: { duration: 0.185 },
    layout: { duration: 0.2 }
  }
};

export const ChatResponseMessages: React.FC<ChatResponseMessagesProps> = React.memo(
  ({ responseMessages: responseMessagesProp, isCompletedStream, selectedFileId }) => {
    const { styles, cx } = useStyles();

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

    const lastMessageIndex = responseMessages.length - 1;

    const getKey = useMemoizedFn((responseMessage: ResponseMessageWithHiddenClusters) => {
      if (Array.isArray(responseMessage)) {
        return responseMessage.map((item) => item.id).join('-') + '';
      }
      return responseMessage.id;
    });

    const typeClassRecord: Record<BusterChatMessageResponse['type'] | 'hidden', string> =
      useMemo(() => {
        return {
          text: cx(styles.textCard, 'text-card'),
          file: cx(styles.fileCard, 'file-card'),
          thought: cx(styles.thoughtCard, 'thought-card'),
          hidden: cx(styles.hiddenCard, 'hidden-card')
        };
      }, []);

    const getContainerClass = (item: ResponseMessageWithHiddenClusters) => {
      if (Array.isArray(item)) {
        return typeClassRecord.hidden;
      }
      return typeClassRecord[item.type];
    };

    return (
      <MessageContainer className="flex w-full flex-col overflow-hidden">
        <AnimatePresence mode="sync" initial={false}>
          {responseMessages.map((responseMessage, index) => (
            <motion.div
              key={getKey(responseMessage)}
              className={cx(getContainerClass(responseMessage), '')}
              layoutId={getKey(responseMessage)}
              {...animationConfig}>
              <ChatResponseMessageSelector
                key={getKey(responseMessage)}
                responseMessage={responseMessage}
                isCompletedStream={isCompletedStream}
                isLastMessageItem={index === lastMessageIndex}
                selectedFileId={selectedFileId}
              />

              <VerticalDivider />
            </motion.div>
          ))}
        </AnimatePresence>
      </MessageContainer>
    );
  }
);

const VerticalDivider: React.FC<{ className?: string }> = ({ className }) => {
  const { cx, styles } = useStyles();
  return <div className={cx(styles.verticalDivider, 'vertical-divider', className)} />;
};

const useStyles = createStyles(({ token, css }) => ({
  hiddenCard: css`
    margin-bottom: 2px;

    .vertical-divider {
      display: none;
    }
  `,
  textCard: css`
    margin-bottom: 14px;

    &:has(+ .text-card) {
      margin-bottom: 8px;
    }

    .vertical-divider {
      display: none;
    }
  `,
  fileCard: css`
    &:has(+ .text-card),
    &:has(+ .hidden-card) {
      .vertical-divider {
        opacity: 0;
      }
      margin-bottom: 0px;
    }

    &:has(+ .thought-card) {
      .vertical-divider {
        opacity: 0;
      }
      margin-bottom: 0px;
    }

    &:last-child {
      .vertical-divider {
        opacity: 0;
      }
    }
  `,
  thoughtCard: css`
    .vertical-divider {
      display: none;
    }

    margin-bottom: 4px;
  `,
  verticalDivider: css`
    transition: opacity 0.2s ease-in-out;
    height: 9px;
    width: 0.5px;
    margin: 3px 0 3px 16px;
    background: ${token.colorTextTertiary};
  `
}));
