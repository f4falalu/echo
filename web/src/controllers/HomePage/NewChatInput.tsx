'use client';

import React from 'react';
import { InputTextAreaButton } from '@/components/ui/inputs/InputTextAreaButton';
import { useBusterChatContextSelector, useBusterNewChatContextSelector } from '@/context/Chats';
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
  const [loading, setLoading] = useState(false);

  const disabledSubmit = useMemo(() => {
    return !inputHasText(inputValue);
  }, [inputValue]);

  const onSubmit = useMemoizedFn(async (value: string) => {
    if (disabledSubmit) return;
    try {
      setLoading(true);
      await onStartNewChat({ prompt: value });
    } finally {
      setLoading(false);
    }
  });

  const onStop = useMemoizedFn(() => {
    setLoading(false);
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
      onStop={onStop}
      loading={loading}
      disabledSubmit={disabledSubmit}
      autoFocus
    />
  );
};
