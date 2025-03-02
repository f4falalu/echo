import React from 'react';
import { FileContainerHeader } from './FileContainerHeader';
import { AppPageLayout } from '@/components/ui/layouts';

interface FileContainerProps {
  children: React.ReactNode;
}

export const FileContainer: React.FC<FileContainerProps> = React.memo(({ children }) => {
  return (
    <AppPageLayout className="flex h-full min-w-[325px] flex-col" header={<FileContainerHeader />}>
      {children}
    </AppPageLayout>
  );
});

FileContainer.displayName = 'FileContainer';
