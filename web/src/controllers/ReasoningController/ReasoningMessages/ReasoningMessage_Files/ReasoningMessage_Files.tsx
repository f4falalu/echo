import React from 'react';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';
import type { BusterChatMessageReasoning_files } from '@/api/asset_interfaces/chat';
import { BarContainer } from '../BarContainer';
import { ReasoningMessage_File } from './ReasoningMessageFile';

export const ReasoningMessage_Files: React.FC<ReasoningMessageProps> = React.memo(
  ({ isCompletedStream, isLastMessageItem, reasoningMessage, chatId }) => {
    const { files, status, id, type, title, secondary_title } =
      reasoningMessage as BusterChatMessageReasoning_files;

    return (
      <BarContainer
        showBar={true}
        status={status}
        isCompletedStream={isCompletedStream}
        title={title}
        secondaryTitle={secondary_title}
        contentClassName="mb-2">
        <div className="flex flex-col gap-3">
          {files.map((file) => (
            <ReasoningMessage_File
              key={file.id}
              {...file}
              chatId={chatId}
              isCompletedStream={isCompletedStream}
            />
          ))}
        </div>
      </BarContainer>
    );
  }
);

ReasoningMessage_Files.displayName = 'ReasoningMessage_Files';
