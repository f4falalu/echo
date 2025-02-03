import React from 'react';
import { FileContainerHeader } from './FileContainerHeader';

interface FileContainerProps {
  children: React.ReactNode;
}

export const FileContainer: React.FC<FileContainerProps> = React.memo(({ children }) => {
  return (
    <div className="flex h-full min-w-[325px] flex-col">
      <FileContainerHeader />
      {children}
    </div>
  );
});

FileContainer.displayName = 'FileContainer';
