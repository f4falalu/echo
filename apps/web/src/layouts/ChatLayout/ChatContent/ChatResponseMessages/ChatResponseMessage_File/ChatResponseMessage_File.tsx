import React, { useMemo } from 'react';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import type { ChatResponseMessageProps } from '../ChatResponseMessageSelector';
import { ChatResponseMessage_DashboardFile } from './ChatResponseMessage_DashboardFile';
import { ChatResponseMessage_StandardFile } from './ChatResponseMessage_StandardFile';
import { useGetFileHref } from './useGetFileHref';
import { useGetIsSelectedFile } from './useGetIsSelectedFile';

export const ChatResponseMessage_File: React.FC<ChatResponseMessageProps> = React.memo(
  ({ isStreamFinished, chatId, responseMessageId, messageId }) => {
    const { data } = useGetChatMessage(messageId, {
      select: (x) => x?.response_messages?.[responseMessageId],
    });
    const responseMessage = data as BusterChatResponseMessage_file;
    const { file_type } = responseMessage;

    const { isSelectedFile } = useGetIsSelectedFile({ responseMessage });

    const linkParams = useGetFileHref({ responseMessage, isSelectedFile, chatId });

    const SelectedComponent = useMemo(() => {
      if (file_type === 'dashboard') {
        return ChatResponseMessage_DashboardFile;
      }
      return ChatResponseMessage_StandardFile;
    }, [file_type]);

    if (!data) return null;

    return (
      <SelectedComponent
        isStreamFinished={isStreamFinished}
        responseMessage={responseMessage}
        isSelectedFile={isSelectedFile}
        chatId={chatId}
        linkParams={linkParams}
      />
    );
  }
);

ChatResponseMessage_File.displayName = 'ChatResponseMessage_File';
