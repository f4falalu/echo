import type { BusterChatMessage } from '@/api/buster_socket/chats';
import React from 'react';
import { ChatUserMessage } from './ChatUserMessage';
import { AnimatePresence, motion } from 'framer-motion';
import { ChatResponseMessages } from './ChatResponseMessages';
import { createStyles } from 'antd-style';

export const ChatMessageBlock: React.FC<{ message: BusterChatMessage }> = React.memo(
  ({ message }) => {
    const { styles, cx } = useStyles();

    const { request_message, response_messages, id } = message;
    return (
      <div className={cx(styles.messageBlock, 'flex flex-col space-y-3.5 px-4 py-2')} id={id}>
        <ChatUserMessage requestMessage={request_message} />
        <ChatResponseMessages responseMessages={response_messages} />
      </div>
    );
  }
);

ChatMessageBlock.displayName = 'ChatMessageBlock';

const useStyles = createStyles(({ token, css }) => ({
  messageBlock: css`
    &:hover {
      background-color: ${token.controlItemBgHover};
    }
  `
}));
