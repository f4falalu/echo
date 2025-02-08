import { BusterChatMessageReasoning } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import last from 'lodash/last';
import { ShimmerText } from '@/components/text';

export const ChatThoughts: React.FC<{
  reasoningMessages: BusterChatMessageReasoning[];
}> = React.memo(({ reasoningMessages }) => {
  const lastMessage = last(reasoningMessages);

  const lastMessageTest = useMemo(() => {
    if (!lastMessage) return null;
    if (lastMessage.type === 'text') {
      return lastMessage;
    }
    return lastMessage.thought_title;
  }, [lastMessage]);

  const hasLastMessage = !!lastMessage || !!lastMessageTest;

  if (!hasLastMessage) return null;

  return <div>ChatThoughts</div>;
});

ChatThoughts.displayName = 'ChatThoughts';

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

const RandomThoughts = React.memo(() => {
  const randomThought = DEFAULT_THOUGHTS[Math.floor(Math.random() * DEFAULT_THOUGHTS.length)];
  return <div>{randomThought}</div>;
});

RandomThoughts.displayName = 'RandomThoughts';
