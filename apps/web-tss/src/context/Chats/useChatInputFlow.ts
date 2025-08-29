import type React from 'react';
import { useMemo, useRef } from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { timeout } from '@/lib/timeout';
import { CHAT_CONTAINER_ID } from '../../layouts/ChatLayout/ChatContainer';
import { useIsAssetFileChanged } from '../BusterAssets/useIsAssetFileChanged';
import { useSelectedAssetId, useSelectedAssetType } from '../BusterAssets/useSelectedAssetType';
import { useChat } from './useChat';
import { useGetCurrentMessageId } from './useGetActiveChat';
import { useGetChatId } from './useGetChatId';
import { useIsChatMode, useIsFileMode } from './useMode';

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
  const isChatMode = useIsChatMode();
  const isFileMode = useIsFileMode();
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
  const { isFileChanged, onResetToOriginal } = useIsAssetFileChanged();
  const { openConfirmModal } = useBusterNotifications();

  const submittingCooldown = useRef(isSubmittingChat);

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

      if (isChatMode || selectedAssetType === 'chat') {
        await onFollowUpChat({ prompt: trimmedInputValue, chatId });
      } else if (selectedAssetType === 'collection') {
        // maybe we will support this one day. Good day that'll be. Until then, we will just dream.
      } else if (isFileMode) {
        if (!selectedAssetId) return;
        await onStartChatFromFile({
          prompt: trimmedInputValue,
          fileId: selectedAssetId,
          fileType: selectedAssetType,
        });
      } else {
        await onStartNewChat({ prompt: trimmedInputValue });
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
    onStopChatContext({ chatId });
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
