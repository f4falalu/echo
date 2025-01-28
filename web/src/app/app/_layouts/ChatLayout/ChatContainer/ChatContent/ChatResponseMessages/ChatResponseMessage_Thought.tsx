import { BusterChatMessage_thought, BusterChatMessageResponse } from '@/api/buster_socket/chats';
import React from 'react';
import { ChatResponseMessageProps } from './ChatResponseMessages';
import { AnimatePresence, motion } from 'framer-motion';
import { animationConfig } from './animationConfig';
import { CircleSpinnerLoader } from '@/components/loaders/CircleSpinnerLoader';
import { Text } from '@/components/text';

export const ChatResponseMessage_Thought: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessage: responseMessageProp }) => {
    const responseMessage = responseMessageProp as BusterChatMessage_thought;
    const { thought_title, thought_secondary_title, thought_pill, in_progress } = responseMessage;

    return <div>ChatResponseMessage_Thought</div>;
  }
);

ChatResponseMessage_Thought.displayName = 'ChatResponseMessage_Thought';
