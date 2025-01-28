import React from 'react';
import { useChatContextSelector } from '../../ChatContext';
import { ChatMessageBlock } from './ChatMessageBlock';
import { ChatInput } from './ChatInput';

export const ChatContent: React.FC<{ chatContentRef: React.RefObject<HTMLDivElement> }> =
  React.memo(({ chatContentRef }) => {
    const chatMessages = useChatContextSelector((state) => state.chatMessages);
    const selectedFileId = useChatContextSelector((x) => x.selectedFileId);

    return (
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div ref={chatContentRef} className="h-full w-full overflow-y-auto">
          <div className="mx-auto max-w-[600px] pb-8">
            {chatMessages?.map((message) => (
              <ChatMessageBlock
                key={message.id}
                message={message}
                selectedFileId={selectedFileId}
              />
            ))}
          </div>
        </div>
        <ChatInput />
      </div>
    );
  });

ChatContent.displayName = 'ChatContent';
