import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import React, { PropsWithChildren, useMemo, useState } from 'react';
import { SelectedFile } from '../interfaces';
import { useUpdateEffect } from 'ahooks';
import type { AppSplitterRef } from '@/components/layout/AppSplitter';

interface UseChatSplitterProps {
  defaultSelectedFile: SelectedFile | undefined;
  appSplitterRef: React.RefObject<AppSplitterRef>;
}

export const useChatSplitter = ({ appSplitterRef, defaultSelectedFile }: UseChatSplitterProps) => {
  const [selectedFile, setSelectedFile] =
    useState<UseChatSplitterProps['defaultSelectedFile']>(defaultSelectedFile);

  const hasFile = !!selectedFile;

  const selectedFileTitle: string = useMemo(() => {
    if (!selectedFile) return '';
    return selectedFile.type;
  }, [selectedFile]);

  const selectedFileType = selectedFile?.type || null;

  const onSetSelectedFile = (file: SelectedFile) => {
    setSelectedFile(file);
  };

  useUpdateEffect(() => {
    if (appSplitterRef.current && appSplitterRef.current.isRightClosed) {
      appSplitterRef.current?.animateWidth('320px', 'left');
    }

    setSelectedFile(defaultSelectedFile);
  }, [defaultSelectedFile]);

  return {
    selectedFileTitle,
    selectedFileType,
    hasFile,
    selectedFile,
    onSetSelectedFile
  };
};

const ChatSplitterContext = createContext<ReturnType<typeof useChatSplitter>>(
  {} as ReturnType<typeof useChatSplitter>
);

interface ChatSplitterContextProviderProps {}

export const ChatSplitterContextProvider: React.FC<
  PropsWithChildren<
    ChatSplitterContextProviderProps & {
      useChatSplitterProps: ReturnType<typeof useChatSplitter>;
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
  selector: ContextSelector<ReturnType<typeof useChatSplitter>, T>
) => useContextSelector(ChatSplitterContext, selector);
