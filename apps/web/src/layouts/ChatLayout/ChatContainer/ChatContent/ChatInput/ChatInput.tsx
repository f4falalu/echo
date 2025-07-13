import React, { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { InputTextAreaButton } from '@/components/ui/inputs/InputTextAreaButton';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { inputHasText } from '@/lib/text';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { AIWarning } from './AIWarning';
import { useChatInputFlow } from './useChatInputFlow';

const autoResizeConfig = { minRows: 2, maxRows: 16 };

export const ChatInput: React.FC = React.memo(() => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const isStreamingMessage = useChatIndividualContextSelector((x) => x.isStreamingMessage);
  const hasChat = useChatIndividualContextSelector((x) => x.hasChat);

  const [inputValue, setInputValue] = useState('');

  const disableSubmit = useMemo(() => {
    return !inputHasText(inputValue) && !isStreamingMessage;
  }, [inputValue, isStreamingMessage]);

  const { onSubmitPreflight, onStopChat } = useChatInputFlow({
    disableSubmit,
    inputValue,
    setInputValue,
    loading: isStreamingMessage,
    textAreaRef
  });

  const onChange = useMemoizedFn((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  });

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
      )}>
      <InputTextAreaButton
        placeholder="Ask Buster a question..."
        autoResize={autoResizeConfig}
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
