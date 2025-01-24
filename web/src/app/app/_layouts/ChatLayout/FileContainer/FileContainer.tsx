import React from 'react';
import type { ChatSplitterProps } from '../ChatLayout';
import { SelectedFile } from '../interfaces';

interface FileContainerProps {
  selectedFile: SelectedFile | undefined;
}

export const FileContainer: React.FC<FileContainerProps> = React.memo(({ selectedFile }) => {
  return <div className="h-full w-full bg-green-500">FileContainer</div>;
});

FileContainer.displayName = 'FileContainer';
