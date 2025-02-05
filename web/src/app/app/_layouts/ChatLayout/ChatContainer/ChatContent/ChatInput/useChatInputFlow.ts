import { useMemo } from 'react';
import { useChatContextSelector } from '../../../ChatContext';
import { useMemoizedFn } from 'ahooks';
import { useBusterNewChatContextSelector } from '@/context/Chats';

type FlowType = 'followup-chat' | 'followup-metric' | 'followup-dashboard' | 'new';

export const useChatInputFlow = ({
  disableSendButton,
  inputValue
}: {
  disableSendButton: boolean;
  inputValue: string;
}) => {
  const hasChat = useChatContextSelector((x) => x.hasChat);
  const selectedFileType = useChatContextSelector((x) => x.selectedFileType);
  const selectedFileId = useChatContextSelector((x) => x.selectedFileId);
  const onStartNewChat = useBusterNewChatContextSelector((state) => state.onStartNewChat);
  const onFollowUpChat = useBusterNewChatContextSelector((state) => state.onFollowUpChat);
  const onStartChatFromFile = useBusterNewChatContextSelector((state) => state.onStartChatFromFile);
  const currentMessageId = useChatContextSelector((x) => x.currentMessageId);

  const flow: FlowType = useMemo(() => {
    if (hasChat) return 'followup-chat';
    if (selectedFileType === 'metric' && selectedFileId) return 'followup-metric';
    if (selectedFileType === 'dashboard' && selectedFileId) return 'followup-dashboard';
    return 'new';
  }, [hasChat, selectedFileType, selectedFileId]);

  const onSubmitPreflight = useMemoizedFn(async () => {
    if (disableSendButton) return;

    switch (flow) {
      case 'followup-chat':
        return onFollowUpChat({ prompt: inputValue, messageId: currentMessageId! });

      case 'followup-metric':
        return onStartChatFromFile({
          prompt: inputValue,
          fileId: selectedFileId!,
          fileType: 'metric'
        });

      case 'followup-dashboard':
        return onStartChatFromFile({
          prompt: inputValue,
          fileId: selectedFileId!,
          fileType: 'dashboard'
        });

      case 'new':
        return onStartNewChat(inputValue);

      default:
        const _exhaustiveCheck: never = flow;
        return _exhaustiveCheck;
    }
  });

  return { onSubmitPreflight };
};
