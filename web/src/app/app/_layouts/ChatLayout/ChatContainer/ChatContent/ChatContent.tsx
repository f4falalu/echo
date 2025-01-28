import React from 'react';
import { useChatContextSelector } from '../../ChatContext';
import { ChatMessageBlock } from './ChatMessageBlock';

export const ChatContent: React.FC<{ chatContentRef: React.RefObject<HTMLDivElement> }> = ({
  chatContentRef
}) => {
  const chatMessages = useChatContextSelector((state) => state.chatMessages);

  return (
    <div ref={chatContentRef} className="h-full w-full overflow-y-auto">
      <div className="mx-auto max-w-[600px]">
        {chatMessages?.map((message) => <ChatMessageBlock key={message.id} message={message} />)}
      </div>
    </div>
  );
};
