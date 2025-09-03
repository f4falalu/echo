'use client';
import React from 'react';
import { BarContainer } from './BarContainer';

export const BlackBoxMessage: React.FC<{
  blackBoxMessage: string | undefined | null;
  finalReasoningMessage: string | undefined | null;
  isStreamFinished: boolean;
}> = React.memo(({ blackBoxMessage, finalReasoningMessage, isStreamFinished }) => {
  if (blackBoxMessage || finalReasoningMessage) {
    return (
      <BarContainer
        showBar={false}
        status={finalReasoningMessage ? 'completed' : 'loading'}
        isStreamFinished={isStreamFinished}
        title={finalReasoningMessage ?? blackBoxMessage ?? ''}
        secondaryTitle={''}
      />
    );
  }

  return null;
});

BlackBoxMessage.displayName = 'BlackBoxMessage';
