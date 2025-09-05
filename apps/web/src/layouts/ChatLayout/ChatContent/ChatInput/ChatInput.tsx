import React, { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { InputTextAreaButton } from '@/components/ui/inputs/InputTextAreaButton';
import { useIsStreamingMessage } from '@/context/Chats/useIsStreamingMessage';
import { useIsChatMode } from '@/context/Chats/useMode';
import { cn } from '@/lib/classMerge';
import { inputHasText } from '@/lib/text';
import { useChatInputFlow } from '../../../../context/Chats/useChatInputFlow';
import { AIWarning } from './AIWarning';

export const ChatInput: React.FC = React.memo(() => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const isStreamingMessage = useIsStreamingMessage();
  const hasChat = useIsChatMode();

  const [inputValue, setInputValue] = useState('');

  const disableSubmit = useMemo(() => {
    return !inputHasText(inputValue) && !isStreamingMessage;
  }, [inputValue, isStreamingMessage]);

  const { onSubmitPreflight, onStopChat } = useChatInputFlow({
    disableSubmit,
    inputValue,
    setInputValue,
    loading: isStreamingMessage,
    textAreaRef,
  });

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  useEffect(() => {
    if (hasChat) {
      requestAnimationFrame(() => {
        textAreaRef.current?.focus();
      });
    }
  }, [hasChat, textAreaRef]);

  return (
    <div
      className={cn(
        'z-10 mx-3 mt-0.5 mb-2 flex min-h-fit flex-col items-center space-y-1.5 overflow-visible'
      )}
    >
      <InputTextAreaButton
        placeholder="Ask Buster a question..."
        minRows={2}
        maxRows={16}
        onSubmit={onSubmitPreflight}
        onChange={onChange}
        onStop={onStopChat}
        loading={isStreamingMessage}
        value={inputValue}
        disabled={!hasChat}
        disabledSubmit={disableSubmit}
        autoFocus
        ref={textAreaRef}
      />

      <AIWarning />
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
