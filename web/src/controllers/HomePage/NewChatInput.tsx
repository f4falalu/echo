'use client';

import { InputTextAreaButton } from '@/components/ui/inputs/InputTextAreaButton';
import { useBusterNewChatContextSelector } from '@/context/Chats';
import { inputHasText } from '@/lib/text';
import { useMemoizedFn } from 'ahooks';
import { ChangeEvent, useMemo, useState } from 'react';

const autoResizeConfig = {
  minRows: 3,
  maxRows: 18
};

export const NewChatInput: React.FC<{}> = () => {
  const onStartNewChat = useBusterNewChatContextSelector((state) => state.onStartNewChat);
  const [inputValue, setInputValue] = useState('');

  const disabledSubmit = useMemo(() => {
    return !inputHasText(inputValue);
  }, [inputValue]);

  const onSubmit = useMemoizedFn((value: string) => {
    onStartNewChat({ prompt: value });
  });

  const onChange = useMemoizedFn((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  });

  return (
    <InputTextAreaButton
      placeholder="Ask Buster a question..."
      autoResize={autoResizeConfig}
      onSubmit={onSubmit}
      onChange={onChange}
      autoFocus
      disabledSubmit={disabledSubmit}
    />
  );
};
