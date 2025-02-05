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

  const onSelectSearchAsset = useMemoizedFn(async (asset: BusterSearchResult) => {
    setLoadingNewChat(true);
    console.log('select search asset');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoadingNewChat(false);
  });

  const onStartNewChat = useMemoizedFn(async (prompt: string) => {
    setLoadingNewChat(true);
    console.log('start new chat');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoadingNewChat(false);
  });

  const onStartChatFromFile = useMemoizedFn(
    async ({}: { prompt: string; fileId: string; fileType: FileType }) => {
      setLoadingNewChat(true);
      console.log('start chat from file');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoadingNewChat(false);
    }
  );

  const onFollowUpChat = useMemoizedFn(
    async ({ prompt, messageId }: { prompt: string; messageId: string }) => {
      setLoadingNewChat(true);
      console.log('follow up chat');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoadingNewChat(false);
    }
  );

  const onReplaceMessageInChat = useMemoizedFn(
    async ({ prompt, messageId }: { prompt: string; messageId: string }) => {
      setLoadingNewChat(true);
      console.log('replace message in chat');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoadingNewChat(false);
    }
  );

  const onStopChat = useMemoizedFn(({ chatId }: { chatId: string }) => {
    setLoadingNewChat(false);
    console.log('stop current chat');
  });

  const onSetSelectedChatDataSource = useMemoizedFn((dataSource: BusterDatasetListItem | null) => {
    setSelectedChatDataSource(dataSource);
  });

  return {
    onStartNewChat,
    loadingNewChat,
    onSelectSearchAsset,
    selectedChatDataSource,
    onSetSelectedChatDataSource,
    onFollowUpChat,
    onStartChatFromFile,
    onReplaceMessageInChat,
    onStopChat
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
