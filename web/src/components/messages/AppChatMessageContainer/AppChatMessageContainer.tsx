import React from 'react';
import type { AppChatMessage, AppChatMessageFileType } from './interfaces';

interface AppChatMessageContainerProps {
  message: AppChatMessage[];
  isStreaming?: boolean;
  className?: string;
  inputPlaceholder?: string;
  onSendMessage: (message: string) => Promise<void>;
  onEditMessage: (id: string, messageText: string) => Promise<void>;
  onFileClick: (file: { type: AppChatMessageFileType; id: string }) => void;
  onPillClick: (pill: { id: string; type: AppChatMessageFileType }) => void;
}

export const AppChatMessageContainer: React.FC<AppChatMessageContainerProps> = React.memo(() => {
  return <div>HERE</div>;
});

AppChatMessageContainer.displayName = 'AppChatMessageContainer';
