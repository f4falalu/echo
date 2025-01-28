import React from 'react';
import { ChatResponseMessageProps } from './ChatResponseMessages';

export const ChatResponseMessage_File: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessage }) => {
    return <div>ChatResponseMessage_File</div>;
  }
);

ChatResponseMessage_File.displayName = 'ChatResponseMessage_File';
