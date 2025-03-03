import React from 'react';
import { useChatIndividualContextSelector } from '../../ChatContext';
import { ChatMessageBlock } from './ChatMessageBlock';
import { ChatInput } from './ChatInput';
import { createStyles } from 'antd-style';

export const ChatContent: React.FC<{ chatContentRef: React.RefObject<HTMLDivElement> }> =
  React.memo(({ chatContentRef }) => {
    const { styles } = useStyles();
    const chatMessageIds = useChatIndividualContextSelector((state) => state.chatMessageIds);
    // const chatMessages = useBusterChatContextSelector((state) => state.chatsMessages);

    const autoClass = 'mx-auto max-w-[600px] w-full';

    return (
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div ref={chatContentRef} className="h-full w-full overflow-y-auto">
          <div className="pb-8">
            {chatMessageIds?.map((messageId) => (
              <div key={messageId} className={styles.messageBlock}>
                <div className={autoClass}>
                  <ChatMessageBlock key={messageId} messageId={messageId} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={autoClass}>
          <ChatInput />
        </div>
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
