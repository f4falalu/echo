import React from 'react';
import { useChatContextSelector } from '../../ChatContext';
import { ChatMessageBlock } from './ChatMessageBlock';
import { ChatInput } from './ChatInput';
import { createStyles } from 'antd-style';

export const ChatContent: React.FC<{ chatContentRef: React.RefObject<HTMLDivElement> }> =
  React.memo(({ chatContentRef }) => {
    const { styles } = useStyles();
    const chatMessages = useChatContextSelector((state) => state.chatMessages);

    return (
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div ref={chatContentRef} className="h-full w-full overflow-y-auto">
          <div className="pb-8">
            {chatMessages?.map((message) => (
              <div key={message.id} className={styles.messageBlock}>
                <div className="mx-auto max-w-[600px]">
                  <ChatMessageBlock key={message.id} message={message} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <ChatInput />
      </div>
    );
  });

ChatContent.displayName = 'ChatContent';

const useStyles = createStyles(({ token, css }) => ({
  messageBlock: css`
    &:hover {
      background-color: ${token.controlItemBgHover};
    }
  `
}));
