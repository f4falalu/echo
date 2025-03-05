import React from 'react';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';
import type { BusterChatMessageReasoning_files } from '@/api/asset_interfaces/chat';
import { BarContainer } from '../BarContainer';
import { ReasoningMessage_File } from './ReasoningMessageFile';
import { useMessageIndividual } from '@/context/Chats';

export const ReasoningMessage_Files: React.FC<ReasoningMessageProps> = React.memo(
  ({ isCompletedStream, chatId, reasoningMessageId, messageId }) => {
    const { status, id, type, title, secondary_title, file_ids } = useMessageIndividual(
      messageId,
      (x) => x?.reasoning_messages[reasoningMessageId]
    ) as BusterChatMessageReasoning_files;

    return (
      <BarContainer
        showBar={true}
        status={status}
        isCompletedStream={isCompletedStream}
        title={title}
        secondaryTitle={secondary_title}
        contentClassName="mb-2">
        <div className="flex flex-col gap-3">
          {file_ids.map((fileId) => (
            <ReasoningMessage_File
              key={fileId}
              fileId={fileId}
              chatId={chatId}
              messageId={messageId}
              reasoningMessageId={reasoningMessageId}
              isCompletedStream={isCompletedStream}
            />
          ))}
        </div>
      </BarContainer>
    );
  }
);

ReasoningMessage_Files.displayName = 'ReasoningMessage_Files';
