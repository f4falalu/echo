'use client';

import { useMemoizedFn } from 'ahooks';
import sample from 'lodash/sample';
import { useBusterChatContextSelector } from '../ChatProvider';
import random from 'lodash/random';
import last from 'lodash/last';
import { useRef } from 'react';
import { IBusterChatMessage } from '../interfaces';
import { ChatEvent_GeneratingReasoningMessage } from '@/api/buster_socket/chats';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';

export const useBlackBoxMessage = () => {
  const timeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const getChatMessageMemoized = useBusterChatContextSelector((x) => x.getChatMessageMemoized);
  const queryClient = useQueryClient();

  const removeAutoThought = useMemoizedFn(({ messageId }: { messageId: string }) => {
    console.log('removeAutoThought', messageId);
    if (timeoutRef.current[messageId]) {
      clearTimeout(timeoutRef.current[messageId]);
      delete timeoutRef.current[messageId];
    }

    const options = queryKeys.chatsBlackBoxMessages(messageId);
    queryClient.setQueryData(options.queryKey, null);
  });

  const addAutoThought = useMemoizedFn(({ messageId }: { messageId: string }) => {
    const randomThought = getRandomThought();
    console.log(messageId, randomThought);
    const options = queryKeys.chatsBlackBoxMessages(messageId);
    queryClient.setQueryData(options.queryKey, randomThought);
  });

  const checkAutoThought = useMemoizedFn(
    (message: IBusterChatMessage, event: ChatEvent_GeneratingReasoningMessage) => {
      const isFinishedReasoningMessage = event.reasoning.status !== 'loading';
      if (isFinishedReasoningMessage) {
        addAutoThought({ messageId: message.id });
        _loopAutoThought({ messageId: message.id });
      } else {
        removeAutoThought({ messageId: message.id });
      }
    }
  );

  const _loopAutoThought = useMemoizedFn(async ({ messageId }: { messageId: string }) => {
    const randomDelay = random(3000, 5000);
    timeoutRef.current[messageId] = setTimeout(() => {
      const message = getChatMessageMemoized(messageId);
      console.log('loopAutoThought', messageId, !!message);
      if (!message) return;
      const isMessageCompletedStream = !!message?.isCompletedStream;
      const lastReasoningMessageId = last(message?.reasoning_message_ids) || '';
      const lastReasoningMessage = message?.reasoning_messages[lastReasoningMessageId];
      const isLastReasoningMessageCompleted = lastReasoningMessage?.status === 'completed';

      if (!isMessageCompletedStream && isLastReasoningMessageCompleted) {
        addAutoThought({ messageId });
        _loopAutoThought({ messageId });
      }
    }, randomDelay);
  });

  return { checkAutoThought, removeAutoThought };
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
  'Finalizing plan details...'
];
