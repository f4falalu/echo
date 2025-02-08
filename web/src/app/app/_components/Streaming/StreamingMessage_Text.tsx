import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { itemAnimationConfig } from './animationConfig';

interface StreamingMessage_TextProps {
  isCompletedStream: boolean;
  message: {
    message_chunk?: string;
    message?: string;
  };
}

export const StreamingMessage_Text: React.FC<StreamingMessage_TextProps> = React.memo(
  ({ message: messageProp, isCompletedStream }) => {
    const { message_chunk, message } = messageProp;

    const [textChunks, setTextChunks] = useState<string[]>([]);

    useEffect(() => {
      if (message_chunk && !message) {
        // Handle streaming chunks
        setTextChunks((prevChunks) => [...prevChunks, message_chunk || '']);
      } else if (message) {
        // Handle complete message
        const currentText = textChunks.join('');
        if (message.startsWith(currentText)) {
          const remainingText = message.slice(currentText.length);
          if (remainingText) {
            setTextChunks((prevChunks) => [...prevChunks, remainingText]);
          }
        } else {
          // If there's a mismatch, just use the complete message
          setTextChunks([message]);
        }
      }
    }, [message_chunk, message]);

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

StreamingMessage_Text.displayName = 'StreamingMessage_Text';
