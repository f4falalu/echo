import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import React, { PropsWithChildren, useMemo, useState } from 'react';
import { SelectedFile } from '../interfaces';

interface UseChatSplitterProps {
  defaultSelectedFile: SelectedFile | undefined;
}

export const useChatLayout = ({ defaultSelectedFile }: UseChatSplitterProps) => {
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

  return {
    selectedFileTitle,
    selectedFileType,
    hasFile,
    selectedFile,
    onSetSelectedFile
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
