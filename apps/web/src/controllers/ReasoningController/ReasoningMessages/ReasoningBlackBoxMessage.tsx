'use client';
import React from 'react';
import { BarContainer } from './BarContainer';
import { BLACK_BOX_INITIAL_THOUGHT } from '@/layouts/ChatLayout/ChatContext/useBlackBoxMessage';

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
        title={finalReasoningMessage ?? blackBoxMessage ?? BLACK_BOX_INITIAL_THOUGHT}
        secondaryTitle={''}
      />
    );
  }

  return null;
});

BlackBoxMessage.displayName = 'BlackBoxMessage';
