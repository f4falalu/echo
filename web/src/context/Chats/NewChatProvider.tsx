import React, { useState } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useMemoizedFn } from 'ahooks';
import type { BusterDatasetListItem, BusterSearchResult, FileType } from '@/api/asset_interfaces';

export const useBusterNewChat = () => {
  const [selectedChatDataSource, setSelectedChatDataSource] =
    useState<BusterDatasetListItem | null>(null);
  const [loadingNewChat, setLoadingNewChat] = useState(false);
  const [prompt, setPrompt] = useState('');

  const onSetPrompt = useMemoizedFn((prompt: string) => {
    setPrompt(prompt);
  });

  const onSelectSearchAsset = useMemoizedFn((asset: BusterSearchResult) => {});

  const onStartNewChat = useMemoizedFn(async (prompt: string) => {
    setLoadingNewChat(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoadingNewChat(false);
  });

  const onStartChatFromFile = useMemoizedFn(
    async ({}: { prompt: string; fileId: string; fileType: FileType }) => {}
  );

  const onFollowUpChat = useMemoizedFn(
    async ({ prompt, messageId }: { prompt: string; messageId: string }) => {
      setLoadingNewChat(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoadingNewChat(false);
    }
  );

  const onReplaceMessageInChat = useMemoizedFn(
    async ({ prompt, messageId }: { prompt: string; messageId: string }) => {}
  );

  const onSetSelectedChatDataSource = useMemoizedFn((dataSource: BusterDatasetListItem | null) => {
    setSelectedChatDataSource(dataSource);
  });

  return {
    onStartNewChat,
    loadingNewChat,
    onSelectSearchAsset,
    selectedChatDataSource,
    onSetSelectedChatDataSource,
    onSetPrompt,
    onFollowUpChat,
    prompt,
    onStartChatFromFile,
    onReplaceMessageInChat
  };
};

export const BusterNewChatContext = createContext<ReturnType<typeof useBusterNewChat>>(
  {} as ReturnType<typeof useBusterNewChat>
);

export const BusterNewChatProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useBusterNewChat();
  return <BusterNewChatContext.Provider value={value}>{children}</BusterNewChatContext.Provider>;
};

export const useBusterNewChatContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterNewChat>, T>
) => useContextSelector(BusterNewChatContext, selector);
