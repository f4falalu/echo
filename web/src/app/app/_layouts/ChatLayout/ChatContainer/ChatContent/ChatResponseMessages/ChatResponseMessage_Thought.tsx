import { BusterChatMessageResponse } from '@/api/buster_socket/chats';
import React from 'react';
import { ChatResponseMessageProps } from './ChatResponseMessages';

export const ChatResponseMessage_Thought: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessage }) => {
    return <div>ChatResponseMessage_Thought</div>;
  }
);

ChatResponseMessage_Thought.displayName = 'ChatResponseMessage_Thought';
