import type React from 'react';
import { useMemo, useRef } from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { timeout } from '@/lib/timeout';
import { CHAT_CONTAINER_ID } from '../../layouts/ChatLayout/ChatContainer';
import { useSelectedAssetId, useSelectedAssetType } from '../BusterAssets/useSelectedAssetType';
import { useChat } from './useChat';
import { useGetCurrentMessageId } from './useGetActiveChat';
import { useGetChatId } from './useGetChatId';
import { useIsChatMode } from './useMode';

type FlowType = 'followup-chat' | 'followup-metric' | 'followup-dashboard' | 'new';

export const useChatInputFlow = ({
  disableSubmit,
  inputValue,
  setInputValue,
  textAreaRef,
  loading,
}: {
  disableSubmit: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
  loading: boolean;
}) => {
  const hasChat = useIsChatMode();
  const chatId = useGetChatId();
  const {
    onFollowUpChat,
    onStartNewChat,
    onStartChatFromFile,
    onStopChat: onStopChatContext,
    isSubmittingChat,
  } = useChat();
  const currentMessageId = useGetCurrentMessageId();
  const selectedAssetType = useSelectedAssetType();
  const selectedAssetId = useSelectedAssetId();
  // const selectedFileType = useChatIndividualContextSelector((x) => x.selectedFileType);
  // const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId);
  // const onStartNewChat = useBusterNewChatContextSelector((state) => state.onStartNewChat);
  // const onFollowUpChat = useBusterNewChatContextSelector((state) => state.onFollowUpChat);
  // const isSubmittingChat = useBusterNewChatContextSelector((state) => state.isSubmittingChat);
  // const onStartChatFromFile = useBusterNewChatContextSelector((state) => state.onStartChatFromFile);
  // const onStopChatContext = useBusterNewChatContextSelector((state) => state.onStopChat);
  // const currentMessageId = useChatIndividualContextSelector((x) => x.currentMessageId);
  // const isFileChanged = useChatIndividualContextSelector((x) => x.isFileChanged);
  // const onResetToOriginal = useChatIndividualContextSelector((x) => x.onResetToOriginal);
  const { openConfirmModal } = useBusterNotifications();

  const submittingCooldown = useRef(isSubmittingChat);

  const flow: FlowType = useMemo(() => {
    if (hasChat) return 'followup-chat';
    if (selectedAssetType === 'metric' && selectedAssetId) return 'followup-metric';
    if (selectedAssetType === 'dashboard' && selectedAssetId) return 'followup-dashboard';
    return 'new';
  }, [hasChat, selectedAssetType, selectedAssetId]);

  const onSubmitPreflight = useMemoizedFn(async () => {
    if (
      disableSubmit ||
      !chatId ||
      !currentMessageId ||
      submittingCooldown.current ||
      isSubmittingChat
    )
      return;

    if (loading) {
      onStopChat();
      return;
    }

    const trimmedInputValue = inputValue.trim();

    const method = async () => {
      submittingCooldown.current = true;
      switch (flow) {
        case 'followup-chat':
          await onFollowUpChat({ prompt: trimmedInputValue, chatId });
          break;

        case 'followup-metric':
          if (!selectedAssetId) return;
          await onStartChatFromFile({
            prompt: trimmedInputValue,
            fileId: selectedAssetId,
            fileType: 'metric',
          });
          break;
        case 'followup-dashboard':
          if (!selectedAssetId) return;
          await onStartChatFromFile({
            prompt: trimmedInputValue,
            fileId: selectedAssetId,
            fileType: 'dashboard',
          });
          break;

        case 'new':
          await onStartNewChat({ prompt: trimmedInputValue });
          break;

        default: {
          const _exhaustiveCheck: never = flow;
          return _exhaustiveCheck;
        }
      }

      setInputValue('');

      setTimeout(() => {
        textAreaRef.current?.focus();
        const container = document.getElementById(CHAT_CONTAINER_ID);
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 50);

      setTimeout(() => {
        submittingCooldown.current = false;
      }, 350);
    };

    if (!isFileChanged) {
      return method();
    }

    await openConfirmModal({
      title: 'Unsaved changes',
      content: 'Looks like you have unsaved changes. Do you want to save them before continuing?',
      primaryButtonProps: {
        text: 'Reset to original',
      },
      cancelButtonProps: {
        text: 'Continue',
      },
      onOk: async () => {
        onResetToOriginal();
        await timeout(25);
        method();
        return;
      },
      onCancel: async () => {
        method();
        return;
      },
    });
  });

  const onStopChat = useMemoizedFn(() => {
    if (!chatId) return;
    onStopChatContext({ chatId, messageId: currentMessageId });
    setTimeout(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.select();
    }, 100);
  });

  return useMemo(
    () => ({ onSubmitPreflight, onStopChat, isFileChanged }),
    [onSubmitPreflight, onStopChat, isFileChanged]
  );
};
