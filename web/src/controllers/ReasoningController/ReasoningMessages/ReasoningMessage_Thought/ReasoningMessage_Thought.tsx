import type { BusterChatMessageReasoning_pills } from '@/api/asset_interfaces';
import React from 'react';
import { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { ReasoningMessage_ThoughtContainer } from './ReasoningMessage_ThoughtContainer';
import { BarContainer } from '../BarContainer';

export const ReasoningMessage_Thought: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessage, isCompletedStream, isLastMessageItem }) => {
    const { thought_title, thought_secondary_title, thoughts, status, id } =
      reasoningMessage as BusterChatMessageReasoning_pills;

    const hasThoughts = !!thoughts && thoughts.length > 0;
    const loadingStatus: NonNullable<BusterChatMessageReasoning_pills['status']> =
      (status ?? (isLastMessageItem && !isCompletedStream)) ? status || 'loading' : 'completed';

    return (
      <BarContainer
        showBar={hasThoughts || !isLastMessageItem}
        status={loadingStatus}
        isCompletedStream={isCompletedStream}
        title={thought_title}
        secondaryTitle={thought_secondary_title}
        contentClassName="mb-3">
        {hasThoughts &&
          thoughts.map((thought, index) => (
            <ReasoningMessage_ThoughtContainer
              key={index}
              thought={thought}
              isCompletedStream={isCompletedStream}
            />
          ))}
      </BarContainer>
    );
  }
);

ReasoningMessage_Thought.displayName = 'ReasoningMessage_Thought';
