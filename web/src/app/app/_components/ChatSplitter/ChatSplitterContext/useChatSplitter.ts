import React, { useState } from 'react';
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

  const onSetSelectedFile = (file: SelectedFile) => {
    setSelectedFile(file);
  };

  useUpdateEffect(() => {
    if (appSplitterRef.current) {
      setSelectedFile(defaultSelectedFile);
      appSplitterRef.current.animateWidth('50%', 'right');
    }
  }, [defaultSelectedFile]);

  return {
    hasFile,
    selectedFile,
    onSetSelectedFile
  };
};
