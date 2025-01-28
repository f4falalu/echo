import React from 'react';
import type { BusterChatMessageResponse } from '@/api/buster_socket/chats';
import { MessageContainer } from '../MessageContainer';

export const ChatResponseMessages: React.FC<{ responseMessages: BusterChatMessageResponse[] }> =
  React.memo(({ responseMessages }) => {
    return <MessageContainer senderName="">ChatResponseMessages</MessageContainer>;
  });

ChatResponseMessages.displayName = 'ChatResponseMessages';
