import React, { useState } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useMemoizedFn } from 'ahooks';
import type { BusterDatasetListItem, BusterSearchResult, FileType } from '@/api/asset_interfaces';

export const useBusterNewChat = () => {
  const [selectedChatDataSourceId, setSelectedChatDataSourceId] = useState<string | null>(null);

  const onSelectSearchAsset = useMemoizedFn(async (asset: BusterSearchResult) => {
    console.log('select search asset');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  const onStartNewChat = useMemoizedFn(async (prompt: string) => {
    console.log('start new chat');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  const onStartChatFromFile = useMemoizedFn(
    async ({}: { prompt: string; fileId: string; fileType: FileType }) => {
      console.log('start chat from file');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  );

  const onFollowUpChat = useMemoizedFn(
    async ({ prompt, messageId }: { prompt: string; messageId: string }) => {
      console.log('follow up chat');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  );

  const onReplaceMessageInChat = useMemoizedFn(
    async ({ prompt, messageId }: { prompt: string; messageId: string }) => {
      console.log('replace message in chat');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  );

  const onStopChat = useMemoizedFn(({ chatId }: { chatId: string }) => {
    console.log('stop current chat');
  });

  const onSetSelectedChatDataSource = useMemoizedFn((dataSource: BusterDatasetListItem | null) => {
    //
  });

  return {
    onStartNewChat,
    onSelectSearchAsset,
    selectedChatDataSourceId,
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
