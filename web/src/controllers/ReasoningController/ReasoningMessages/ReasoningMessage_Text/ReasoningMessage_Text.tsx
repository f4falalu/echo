import React from 'react';
import { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { type BusterChatMessageReasoning_text } from '@/api/asset_interfaces/chat';
import { useMessageIndividual } from '@/context/Chats';
import { AppMarkdown } from '@/components/ui/typography/AppMarkdown';

export const ReasoningMessage_Text: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessageId, messageId, isCompletedStream }) => {
    const message = useMessageIndividual(
      messageId,
      (x) => (x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_text)?.message
    )!;

    return (
      <AppMarkdown
        markdown={message}
        showLoader={!isCompletedStream}
        className="text-text-secondary text-xs!"
        stripFormatting
      />
    );
  }
);

ReasoningMessage_Text.displayName = 'ReasoningMessage_Text';
