import React, { useEffect, useRef, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { itemAnimationConfig } from './animationConfig';
import { useMemoizedFn } from 'ahooks';

interface StreamingMessage_TextProps {
  isCompletedStream: boolean;
  message: string;
}

export const StreamingMessage_Text: React.FC<StreamingMessage_TextProps> = React.memo(
  ({ message, isCompletedStream }) => {
    const [isPending, startTransition] = useTransition();
    const textChunksRef = useRef<string[]>([]);

    const setTextChunks = useMemoizedFn((updater: (prevChunks: string[]) => string[]) => {
      textChunksRef.current = updater(textChunksRef.current);
      startTransition(() => {
        //just used to trigger UI update
      });
    });

    useEffect(() => {
      if (message) {
        // Handle complete message
        const currentText = textChunksRef.current.join('');

        if (message.startsWith(currentText)) {
          const remainingText = message.slice(currentText.length);
          if (remainingText) {
            setTextChunks((prevChunks) => [...prevChunks, remainingText]);
          }
        } else {
          // If there's a mismatch, just use the complete message
          setTextChunks(() => [message]);
        }
      }
    }, [message]);

    return (
      <div className={''}>
        {textChunksRef.current.map((chunk, index) => (
          <AnimatePresence key={index} initial={!isCompletedStream}>
            <motion.span {...itemAnimationConfig}>{chunk}</motion.span>
          </AnimatePresence>
        ))}
      </div>
    );
  }
);

StreamingMessage_Text.displayName = 'StreamingMessage_Text';
