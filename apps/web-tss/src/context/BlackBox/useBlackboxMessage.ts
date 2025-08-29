import last from 'lodash/last';
import random from 'lodash/random';
import sample from 'lodash/sample';
import { useMemo, useRef } from 'react';
import { useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import type { BusterChatMessage } from '../../api/asset_interfaces/chat';
import * as blackboxStore from './blackbox-store';

export const BLACK_BOX_INITIAL_THOUGHT = 'Getting started...';

export const useBlackboxMessage = () => {
  const timeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const getChatMessageMemoized = useGetChatMessageMemoized();

  const clearTimeoutRef = (messageId: string) => {
    if (timeoutRef.current[messageId]) {
      clearTimeout(timeoutRef.current[messageId]);
      delete timeoutRef.current[messageId];
    }
  };

  const removeBlackBoxMessage = (messageId: string) => {
    clearTimeoutRef(messageId);
    blackboxStore.removeBlackBoxMessage(messageId);
  };

  const addBlackBoxMessage = ({ messageId }: { messageId: string }) => {
    const reasoningMessageIds = getChatMessageMemoized(messageId)?.reasoning_message_ids;
    const existingMessage = blackboxStore.getBlackBoxMessage(messageId);

    // If no existing message or no reasoning messages, use BLACK_BOX_INITIAL_THOUGHT as the first message
    const thought = reasoningMessageIds?.length
      ? getRandomThought(existingMessage as string)
      : BLACK_BOX_INITIAL_THOUGHT;

    blackboxStore.setBlackBoxMessage(messageId, thought);
  };

  const _loopAutoThought = async ({ messageId }: { messageId: string }) => {
    const randomDelay = random(7000, 7000);
    timeoutRef.current[messageId] = setTimeout(() => {
      const message = getChatMessageMemoized(messageId);
      if (!message) return;
      if (!timeoutRef.current[messageId]) return;

      const isMessageCompletedStream = !!message?.is_completed;
      const lastReasoningMessageId = last(message?.reasoning_message_ids) || '';
      const lastReasoningMessage = message?.reasoning_messages[lastReasoningMessageId];
      const isLastReasoningMessageCompleted = lastReasoningMessage?.status === 'completed';

      if (!isMessageCompletedStream && isLastReasoningMessageCompleted) {
        addBlackBoxMessage({ messageId });
        _loopAutoThought({ messageId });
      }
    }, randomDelay);
  };

  const checkBlackBoxMessage = (
    message: Pick<
      BusterChatMessage,
      | 'id'
      | 'reasoning_messages'
      | 'reasoning_message_ids'
      | 'is_completed'
      | 'final_reasoning_message'
    >
  ) => {
    const lastReasoningMessageId = last(message.reasoning_message_ids) || '';
    const lastReasoningMessage = message.reasoning_messages[lastReasoningMessageId];
    const isFinishedReasoningMessage = lastReasoningMessage?.status !== 'loading';
    const isFinishedReasoningLoop = message.is_completed || !!message.final_reasoning_message;

    if (isFinishedReasoningMessage && !isFinishedReasoningLoop && !message.is_completed) {
      clearTimeoutRef(message.id);
      addBlackBoxMessage({ messageId: message.id });
      _loopAutoThought({ messageId: message.id });
    } else {
      removeBlackBoxMessage(message.id);
    }
  };

  return useMemo(() => ({ checkBlackBoxMessage, removeBlackBoxMessage }), []);
};

const getRandomThought = (currentThought?: string): string => {
  const thoughts = currentThought
    ? DEFAULT_THOUGHTS.filter((t) => t !== currentThought)
    : DEFAULT_THOUGHTS;
  return sample(thoughts) ?? DEFAULT_THOUGHTS[0];
};

const DEFAULT_THOUGHTS = [
  'Thinking through next steps...',
  'Looking through context...',
  'Reflecting on the instructions...',
  'Analyzing available actions',
  'Reviewing the objective...',
  'Deciding feasible options...',
  'Sorting out some details...',
  'Exploring other possibilities...',
  'Confirming things....',
  'Mapping information across files...',
  'Making a few edits...',
  'Filling out arguments...',
  'Double-checking the logic...',
  'Validating my approach...',
  'Looking at a few edge cases...',
  'Ensuring everything aligns...',
  'Polishing the details...',
  'Making some adjustments...',
  'Writing out arguments...',
  'Mapping trends and patterns...',
  'Re-evaluating this step...',
  'Updating parameters...',
  'Evaluating available data...',
  'Reviewing all parameters...',
  'Processing relevant info...',
  'Aligning with user request...',
  'Gathering necessary details...',
  'Sorting through options...',
  'Editing my system logic...',
  'Cross-checking references...',
  'Validating my approach...',
  'Rewriting operational details...',
  'Mapping new information...',
  'Adjusting priorities & approach...',
  'Revisiting earlier inputs...',
  'Finalizing plan details...',
];
