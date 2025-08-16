import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { InputTextAreaButton } from '@/components/ui/inputs/InputTextAreaButton';
import { useChat } from '@/context/Chats/useChat';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useMount } from '@/hooks/useMount';
import { inputHasText } from '@/lib/text';

const autoResizeConfig = {
  minRows: 3,
  maxRows: 18,
};

export const NewChatInput: React.FC<{
  initialValue?: string;
  autoSubmit?: boolean;
}> = ({ initialValue, autoSubmit }) => {
  const { onStartNewChat } = useChat();
  const [inputValue, setInputValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const disabledSubmit = useMemo(() => {
    return !inputHasText(inputValue);
  }, [inputValue]);

  const onSubmit = useMemoizedFn(async (value: string) => {
    if (disabledSubmit || loading) return;
    try {
      setLoading(true);
      const trimmedValue = value.trim();
      await onStartNewChat({ prompt: trimmedValue });
    } catch (error) {
      setLoading(false);
    }
  });

  const onChange = useMemoizedFn((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  });

  useMount(() => {
    if (autoSubmit && inputValue) {
      onSubmit(inputValue);
    } else if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  });

  return (
    <InputTextAreaButton
      className={'transition-all duration-300 hover:shadow-lg active:shadow-md'}
      placeholder="Ask Buster a question..."
      autoResize={autoResizeConfig}
      onSubmit={onSubmit}
      onChange={onChange}
      loading={loading}
      disabled={false}
      disabledSubmit={disabledSubmit}
      autoFocus
      ref={textAreaRef}
      value={inputValue}
    />
  );
};
