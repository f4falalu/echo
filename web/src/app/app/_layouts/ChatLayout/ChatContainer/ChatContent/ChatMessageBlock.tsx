import React from 'react';
import { ChatUserMessage } from './ChatUserMessage';
import { ChatResponseMessages } from './ChatResponseMessages';
import { createStyles } from 'antd-style';
import type { IBusterChatMessage } from '@/context/Chats/interfaces';

export const ChatMessageBlock: React.FC<{
  message: IBusterChatMessage;
  selectedFileId: string | undefined;
}> = React.memo(({ message, selectedFileId }) => {
  const { styles, cx } = useStyles();

  const { request_message, response_messages, id, isCompletedStream } = message;

  return (
    <div className={cx(styles.messageBlock, 'flex flex-col space-y-3.5 px-4 py-2')} id={id}>
      <ChatUserMessage requestMessage={request_message} />
      <ChatResponseMessages
        responseMessages={response_messages}
        isCompletedStream={isCompletedStream}
        selectedFileId={selectedFileId}
      />
    </div>
  );
});

ChatMessageBlock.displayName = 'ChatMessageBlock';

const useStyles = createStyles(({ token, css }) => ({
  messageBlock: css`
    &:hover {
      background-color: ${token.controlItemBgHover};
    }
  `
}));
