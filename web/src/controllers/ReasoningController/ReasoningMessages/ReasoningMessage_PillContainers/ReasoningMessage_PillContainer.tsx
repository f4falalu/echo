import { BusterChatMessageReasoning_PillsContainer } from '@/api/asset_interfaces';
import React from 'react';
import { Text } from '@/components/ui';
import { ReasoningMessage_Pills } from './ReasoningMessage_Pills';

export const ReasoningMessage_PillContainer: React.FC<{
  pillContainer: BusterChatMessageReasoning_PillsContainer;
  isCompletedStream: boolean;
}> = React.memo(({ pillContainer, isCompletedStream }) => {
  return (
    <div className="flex flex-col space-y-1">
      <Text size="xs" type="tertiary">
        {pillContainer.title}
      </Text>
      <ReasoningMessage_Pills pills={pillContainer.pills} isCompletedStream={isCompletedStream} />
    </div>
  );
});

ReasoningMessage_PillContainer.displayName = 'ReasoningMessage_PillContainer';
