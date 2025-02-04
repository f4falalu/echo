import { BusterChatMessage_text } from '@/api/asset_interfaces';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { itemAnimationConfig } from './animationConfig';
import { ChatResponseMessageProps } from './ChatResponseMessageSelector';

export const ChatResponseMessage_Text: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessage: responseMessageProp, isCompletedStream }) => {
    const responseMessage = responseMessageProp as BusterChatMessage_text;

    const [textChunks, setTextChunks] = useState<string[]>([]);

    useEffect(() => {
      if (responseMessage.message_chunk && !responseMessage.message) {
        // Handle streaming chunks
        setTextChunks((prevChunks) => [...prevChunks, responseMessage.message_chunk || '']);
      } else if (responseMessage.message) {
        // Handle complete message
        const currentText = textChunks.join('');
        if (responseMessage.message.startsWith(currentText)) {
          const remainingText = responseMessage.message.slice(currentText.length);
          if (remainingText) {
            setTextChunks((prevChunks) => [...prevChunks, remainingText]);
          }
        } else {
          // If there's a mismatch, just use the complete message
          setTextChunks([responseMessage.message]);
        }
      }
    }, [responseMessage?.message_chunk, responseMessage?.message]);

    return (
      <div className={''}>
        {textChunks.map((chunk, index) => (
          <AnimatePresence key={index} initial={!isCompletedStream}>
            <motion.span {...itemAnimationConfig}>{chunk}</motion.span>
          </AnimatePresence>
        ))}
      </div>
    );
  }
);

ChatResponseMessage_Text.displayName = 'ChatResponseMessage_Text';
