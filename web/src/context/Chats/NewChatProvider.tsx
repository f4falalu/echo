import React, { useState } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useMemoizedFn } from 'ahooks';
import type { BusterDatasetListItem, BusterSearchResult } from '@/api/asset_interfaces';

export const useBusterNewChat = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedChatDataSource, setSelectedChatDataSource] =
    useState<BusterDatasetListItem | null>(null);
  const [loadingNewChat, setLoadingNewChat] = useState(false);

  const onSetPrompt = useMemoizedFn((prompt: string) => {
    setPrompt(prompt);
  });

  const onSelectSearchAsset = useMemoizedFn((asset: BusterSearchResult) => {});

  const onStartNewChat = useMemoizedFn(async (prompt: string) => {
    setLoadingNewChat(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoadingNewChat(false);
  });

  const onSetSelectedChatDataSource = useMemoizedFn((dataSource: BusterDatasetListItem | null) => {
    setSelectedChatDataSource(dataSource);
  });

  return {
    onStartNewChat,
    prompt,
    onSetPrompt,
    loadingNewChat,
    onSelectSearchAsset,
    selectedChatDataSource,
    onSetSelectedChatDataSource
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
