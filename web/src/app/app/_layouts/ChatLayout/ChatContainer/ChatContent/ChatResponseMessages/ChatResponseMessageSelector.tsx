import React, { useMemo } from 'react';
import { ChatResponseMessage_File } from './ChatResponseMessage_File';
import { StreamingMessage_Text } from '@appComponents/Streaming/StreamingMessage_Text';
import type { BusterChatMessage_text, BusterChatMessageResponse } from '@/api/asset_interfaces';
import { createStyles } from 'antd-style';
import { useMemoizedFn } from 'ahooks';

export interface ChatResponseMessageProps {
  responseMessage: BusterChatMessageResponse;
  isCompletedStream: boolean;
  isLastMessageItem: boolean;
}

const ChatResponseMessageRecord: Record<
  BusterChatMessageResponse['type'],
  React.FC<ChatResponseMessageProps>
> = {
  text: (props) => (
    <StreamingMessage_Text {...props} message={props.responseMessage as BusterChatMessage_text} />
  ),
  file: ChatResponseMessage_File
};

export interface ChatResponseMessageSelectorProps {
  responseMessage: BusterChatMessageResponse;
  isCompletedStream: boolean;
  isLastMessageItem: boolean;
}

export const ChatResponseMessageSelector: React.FC<ChatResponseMessageSelectorProps> = ({
  responseMessage,
  isCompletedStream,
  isLastMessageItem
}) => {
  const messageType = responseMessage.type;
  const ChatResponseMessage = ChatResponseMessageRecord[messageType];
  const { cx, styles } = useStyles();

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
    <div key={responseMessage.id} className={getContainerClass(responseMessage)}>
      <ChatResponseMessage
        responseMessage={responseMessage}
        isCompletedStream={isCompletedStream}
        isLastMessageItem={isLastMessageItem}
      />
      <VerticalDivider />
    </div>
  );
};

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
    &:has(+ .text-card) {
      .vertical-divider {
        opacity: 0;
      }
    }

    &:has(+ .file-card) {
      .vertical-divider {
        opacity: 1;
      }
      margin-bottom: 1px;
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
