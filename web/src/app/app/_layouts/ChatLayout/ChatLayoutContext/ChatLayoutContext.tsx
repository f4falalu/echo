import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import React, { PropsWithChildren, useMemo, useState } from 'react';
import { SelectedFile } from '../interfaces';

interface UseChatSplitterProps {
  selectedFile: SelectedFile | undefined;
}

export const useChatLayout = ({ selectedFile: selectedFileProp }: UseChatSplitterProps) => {
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(selectedFileProp?.id);

  const hasFile = !!selectedFileId;

  const selectedFileTitle: string = useMemo(() => {
    console.log('selectedFileId', selectedFileId);
    if (!selectedFileId) return '';
    return 'test';
  }, [selectedFileId]);

  const selectedFileType = selectedFileProp?.type;

  const onSetSelectedFile = (file: SelectedFile) => {
    // setSelectedFileId(file.id);
  };

  return {
    selectedFileTitle,
    selectedFileType,
    selectedFileId,
    hasFile,
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
