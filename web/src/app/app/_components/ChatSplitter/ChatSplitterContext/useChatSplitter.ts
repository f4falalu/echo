import React, { useMemo, useState } from 'react';
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
    return 'This is a test';
  }, [selectedFile]);

  const onSetSelectedFile = (file: SelectedFile) => {
    setSelectedFile(file);
  };

  useUpdateEffect(() => {
    if (appSplitterRef.current) {
      setSelectedFile(defaultSelectedFile);
      setTimeout(() => {
        appSplitterRef.current?.animateWidth('50%', 'right');
      }, 1000);

      appSplitterRef.current?.animateWidth('100px', 'right');
    }
  }, [defaultSelectedFile]);

  return {
    selectedFileTitle,
    hasFile,
    selectedFile,
    onSetSelectedFile
  };
};
