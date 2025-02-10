import React, { useMemo } from 'react';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { useMemoizedFn } from 'ahooks';
import { useBusterNewChatContextSelector } from '@/context/Chats';
import type { TextAreaRef } from 'antd/es/input/TextArea';

type FlowType = 'followup-chat' | 'followup-metric' | 'followup-dashboard' | 'new';

export const useChatInputFlow = ({
  disableSendButton,
  inputValue,
  setInputValue,
  inputRef,
  loading
}: {
  disableSendButton: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  inputRef: React.RefObject<TextAreaRef>;
  loading: boolean;
}) => {
  const hasChat = useChatIndividualContextSelector((x) => x.hasChat);
  const chatId = useChatIndividualContextSelector((x) => x.chatId);
  const selectedFileType = useChatIndividualContextSelector((x) => x.selectedFileType);
  const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId);
  const onStartNewChat = useBusterNewChatContextSelector((state) => state.onStartNewChat);
  const onFollowUpChat = useBusterNewChatContextSelector((state) => state.onFollowUpChat);
  const onStartChatFromFile = useBusterNewChatContextSelector((state) => state.onStartChatFromFile);
  const onStopChat = useBusterNewChatContextSelector((state) => state.onStopChat);
  const currentMessageId = useChatIndividualContextSelector((x) => x.currentMessageId);

  const flow: FlowType = useMemo(() => {
    if (hasChat) return 'followup-chat';
    if (selectedFileType === 'metric' && selectedFileId) return 'followup-metric';
    if (selectedFileType === 'dashboard' && selectedFileId) return 'followup-dashboard';
    return 'new';
  }, [hasChat, selectedFileType, selectedFileId]);

  const onSubmitPreflight = useMemoizedFn(async () => {
    if (disableSendButton || !chatId || !currentMessageId) return;

    if (loading) {
      onStopChat({ chatId: chatId!, messageId: currentMessageId });
      return;
    }

    switch (flow) {
      case 'followup-chat':
        await onFollowUpChat({ prompt: inputValue, chatId: chatId });
        break;

      case 'followup-metric':
        await onStartChatFromFile({
          prompt: inputValue,
          fileId: selectedFileId!,
          fileType: 'metric'
        });
        break;
      case 'followup-dashboard':
        await onStartChatFromFile({
          prompt: inputValue,
          fileId: selectedFileId!,
          fileType: 'dashboard'
        });
        break;

      case 'new':
        await onStartNewChat(inputValue);
        break;

      default:
        const _exhaustiveCheck: never = flow;
        return _exhaustiveCheck;
    }

    setInputValue('');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  });

  return { onSubmitPreflight };
};
