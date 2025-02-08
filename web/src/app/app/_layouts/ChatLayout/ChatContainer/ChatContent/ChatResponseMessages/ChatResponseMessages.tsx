import React, { useMemo } from 'react';
import type { BusterChatMessageResponse } from '@/api/asset_interfaces';
import { MessageContainer } from '../MessageContainer';
import { useMemoizedFn } from 'ahooks';
import { ChatResponseMessageSelector } from './ChatResponseMessageSelector';
import { createStyles } from 'antd-style';

interface ChatResponseMessagesProps {
  responseMessages: BusterChatMessageResponse[];
  isCompletedStream: boolean;
}

export const ChatResponseMessages: React.FC<ChatResponseMessagesProps> = React.memo(
  ({ responseMessages, isCompletedStream }) => {
    const { styles, cx } = useStyles();

    const firstResponseMessage = responseMessages[0];
    const restResponseMessages = responseMessages.slice(1);

    const lastMessageIndex = responseMessages.length - 1;

    const typeClassRecord: Record<BusterChatMessageResponse['type'], string> = useMemo(() => {
      return {
        text: cx(styles.textCard, 'text-card'),
        file: cx(styles.fileCard, 'file-card')
      };
    }, []);

    const getContainerClass = useMemoizedFn((item: BusterChatMessageResponse) => {
      return typeClassRecord[item.type];
    });

    return (
      <MessageContainer className="flex w-full flex-col overflow-hidden">
        {responseMessages.map((responseMessage, index) => (
          <div key={responseMessage.id} className={getContainerClass(responseMessage)}>
            <ChatResponseMessageSelector
              responseMessage={responseMessage}
              isCompletedStream={isCompletedStream}
              isLastMessageItem={index === lastMessageIndex}
            />
            <VerticalDivider />
          </div>
        ))}
      </MessageContainer>
    );
  }
);

ChatResponseMessages.displayName = 'ChatResponseMessages';

const VerticalDivider: React.FC<{ className?: string }> = React.memo(({ className }) => {
  const { cx, styles } = useStyles();
  return <div className={cx(styles.verticalDivider, 'vertical-divider', className)} />;
});
VerticalDivider.displayName = 'VerticalDivider';

const useStyles = createStyles(({ token, css }) => ({
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
  verticalDivider: css`
    transition: opacity 0.2s ease-in-out;
    height: 9px;
    width: 0.5px;
    margin: 3px 0 3px 16px;
    background: ${token.colorTextTertiary};
  `
}));
