import {
  BusterChatMessageReasoning,
  BusterChatMessageReasoning_pills
} from '@/api/asset_interfaces';
import { useMemoizedFn } from 'ahooks';
import sample from 'lodash/sample';
import last from 'lodash/last';
import { useBusterChatContextSelector } from '../ChatProvider';
import { timeout } from '@/lib';
import random from 'lodash/random';

export const useAutoAppendThought = () => {
  const onUpdateChatMessage = useBusterChatContextSelector((x) => x.onUpdateChatMessage);
  const getChatMessagesMemoized = useBusterChatContextSelector((x) => x.getChatMessagesMemoized);

  const removeAutoThoughts = useMemoizedFn(
    (reasoningMessages: BusterChatMessageReasoning[]): BusterChatMessageReasoning[] => {
      return reasoningMessages.filter((rm) => rm.id !== AUTO_THOUGHT_ID);
    }
  );

  const autoAppendThought = useMemoizedFn(
    (
      reasoningMessages: BusterChatMessageReasoning[],
      chatId: string
    ): BusterChatMessageReasoning[] => {
      const lastReasoningMessage = reasoningMessages[reasoningMessages.length - 1];
      const lastMessageIsCompleted =
        !lastReasoningMessage || lastReasoningMessage?.status === 'completed';

      if (lastMessageIsCompleted) {
        _loopAutoThought(chatId);

        return [...reasoningMessages, createAutoThought()];
      }

      return removeAutoThoughts(reasoningMessages);
    }
  );

  const _loopAutoThought = useMemoizedFn(async (chatId: string) => {
    const randomDelay = random(3000, 5000);
    await timeout(randomDelay);
    const chatMessages = getChatMessagesMemoized(chatId);
    const lastMessage = last(chatMessages);
    const isCompletedStream = !!lastMessage?.isCompletedStream;
    const lastReasoningMessage = last(lastMessage?.reasoning);
    const lastReasoningMessageIsAutoAppended =
      !lastReasoningMessage || lastReasoningMessage?.id === AUTO_THOUGHT_ID;

    if (!isCompletedStream && lastReasoningMessageIsAutoAppended && lastMessage) {
      const lastMessageId = lastMessage?.id!;
      const lastReasoningMessageIndex = lastMessage?.reasoning.length - 1;
      const updatedReasoning = lastMessage?.reasoning.slice(0, lastReasoningMessageIndex);
      const newReasoningMessages = [...updatedReasoning, createAutoThought()];

      onUpdateChatMessage({
        id: lastMessageId,
        reasoning: newReasoningMessages,
        isCompletedStream: false
      });

      _loopAutoThought(chatId);
    }
  });

  return { autoAppendThought, removeAutoThoughts };
};

const getRandomThought = (currentThought?: string): string => {
  const thoughts = currentThought
    ? DEFAULT_THOUGHTS.filter((t) => t !== currentThought)
    : DEFAULT_THOUGHTS;
  return sample(thoughts) ?? DEFAULT_THOUGHTS[0];
};

const AUTO_THOUGHT_ID = 'stub-thought-id';
const createAutoThought = (currentThought?: string): BusterChatMessageReasoning_pills => {
  return {
    id: AUTO_THOUGHT_ID,
    type: 'pills',
    title: getRandomThought(currentThought),
    secondary_title: '',
    pill_containers: [],
    status: 'loading'
  };
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
