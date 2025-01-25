import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import React, { PropsWithChildren, useLayoutEffect, useMemo, useState } from 'react';
import type { SelectedFile } from '../interfaces';
import type { ChatSplitterProps } from '../ChatLayout';
import { useMemoizedFn } from 'ahooks';
import { useRouter } from 'next/navigation';
import type { AppSplitterRef } from '@/components/layout';
import { AppChatMessageFileType } from '@/components/messages/AppChatMessageContainer';

interface UseChatSplitterProps {
  defaultSelectedFile: SelectedFile | undefined;
  defaultSelectedLayout: ChatSplitterProps['defaultSelectedLayout'];
  appSplitterRef: React.RefObject<AppSplitterRef>;
  chatId: string | undefined;
}

export const useChatLayout = ({
  defaultSelectedFile,
  defaultSelectedLayout,
  appSplitterRef,
  chatId
}: UseChatSplitterProps) => {
  const router = useRouter();
  const selectedFileId = defaultSelectedFile?.id;
  const selectedFileType = defaultSelectedFile?.type;
  const hasFile = !!selectedFileId;

  const [selectedLayout, setSelectedLayout] = useState(defaultSelectedLayout);
  const [selectedFile, setSelectedFile] = useState(defaultSelectedFile);

  const selectedFileTitle: string = useMemo(() => {
    if (!selectedFileId) return '';
    return 'test';
  }, [selectedFileId]);

  const onSetSelectedFile = useMemoizedFn((file: SelectedFile) => {
    const isChatView = defaultSelectedLayout === 'chat' || defaultSelectedLayout === 'both';
    const fileType = file.type;
    const fileId = file.id;
    if (isChatView && chatId) {
      const routeRecord: Record<AppChatMessageFileType, string> = {
        collection: `/test/splitter/chat/${chatId}/collection/${file.id}`,
        dataset: `/test/splitter/chat/${chatId}/dataset/${file.id}`,
        metric: `/test/splitter/chat/${chatId}/metric/${file.id}`,
        dashboard: `/test/splitter/chat/${chatId}/dashboard/${file.id}`
      };
      if (routeRecord[fileType]) router.push(routeRecord[fileType]);
    } else {
      router.push(`/test/splitter/${fileType}/${fileId}`);
    }
  });

  const onCollapseFileClick = useMemoizedFn((close?: boolean) => {
    const isCloseAction = close ?? selectedLayout === 'both';
    if (isCloseAction) {
      setSelectedLayout('chat');
    } else {
      setSelectedLayout('both');
      appSplitterRef.current?.animateWidth('320px', 'left');
    }
  });

  useLayoutEffect(() => {
    if (defaultSelectedLayout) setSelectedLayout(defaultSelectedLayout);
  }, [defaultSelectedLayout]);

  return {
    selectedFileTitle,
    selectedFileType,
    selectedLayout,
    selectedFileId,
    hasFile,

    onSetSelectedFile,
    onCollapseFileClick
  };
};

const ChatSplitterContext = createContext<ReturnType<typeof useChatLayout>>(
  {} as ReturnType<typeof useChatLayout>
);

interface ChatSplitterContextProviderProps {}

export const ChatSplitterContextProvider: React.FC<
  PropsWithChildren<
    ChatSplitterContextProviderProps & {
      useChatSplitterProps: ReturnType<typeof useChatLayout>;
    }
  >
> = React.memo(({ children, useChatSplitterProps }) => {
  return (
    <ChatSplitterContext.Provider value={useChatSplitterProps}>
      {children}
    </ChatSplitterContext.Provider>
  );
});

ChatSplitterContextProvider.displayName = 'ChatSplitterContextProvider';

export const useChatSplitterContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useChatLayout>, T>
) => useContextSelector(ChatSplitterContext, selector);
