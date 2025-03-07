import React from 'react';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';
import type {
  BusterChatMessageReasoning_files,
  BusterChatMessage
} from '@/api/asset_interfaces/chat';
import { BarContainer } from '../BarContainer';
import { ReasoningMessage_File } from './ReasoningMessageFile';
import { useMessageIndividual } from '@/context/Chats';

const getReasoningMessage = (x: BusterChatMessage | undefined, reasoningMessageId: string) =>
  x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_files;

export const ReasoningMessage_Files: React.FC<ReasoningMessageProps> = React.memo(
  ({ isCompletedStream, chatId, reasoningMessageId, messageId }) => {
    const status = useMessageIndividual(
      messageId,
      (x) => getReasoningMessage(x, reasoningMessageId)?.status
    );

    const file_ids = useMessageIndividual(
      messageId,
      (x) => getReasoningMessage(x, reasoningMessageId)?.file_ids
    );

    const title = useMessageIndividual(
      messageId,
      (x) => getReasoningMessage(x, reasoningMessageId)?.title
    );

    const secondary_title = useMessageIndividual(
      messageId,
      (x) => getReasoningMessage(x, reasoningMessageId)?.secondary_title
    );

    if (!title) return null;

    console.log(reasoningMessageId, isCompletedStream);

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
