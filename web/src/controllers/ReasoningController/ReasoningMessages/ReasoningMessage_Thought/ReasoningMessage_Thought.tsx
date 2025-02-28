import React from 'react';
import type { BusterChatMessageReasoning_pills } from '@/api/asset_interfaces';
import { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { ReasoningMessage_ThoughtContainer } from './ReasoningMessage_ThoughtContainer';
import { BarContainer } from '../BarContainer';

export const ReasoningMessage_Thought: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessage, isCompletedStream, isLastMessageItem }) => {
    const { title, secondary_title, pill_containers, status, id } =
      reasoningMessage as BusterChatMessageReasoning_pills;

    const hasThoughts = !!pill_containers && pill_containers.length > 0;
    const loadingStatus: NonNullable<BusterChatMessageReasoning_pills['status']> =
      (status ?? (isLastMessageItem && !isCompletedStream)) ? status || 'loading' : 'completed';

    return (
      <BarContainer
        showBar={hasThoughts || !isLastMessageItem}
        status={loadingStatus}
        isCompletedStream={isCompletedStream}
        title={title}
        secondaryTitle={secondary_title}
        contentClassName="mb-3">
        {hasThoughts &&
          pill_containers.map((pill_container, index) => (
            <ReasoningMessage_ThoughtContainer
              key={index}
              pillContainer={pill_container}
              isCompletedStream={isCompletedStream}
            />
          ))}
      </BarContainer>
    );
  }
);

ReasoningMessage_Thought.displayName = 'ReasoningMessage_Thought';
