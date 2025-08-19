import type React from 'react';

import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { AppPageLayoutHeader } from '@/components/ui/layouts/AppPageLayoutHeader';

export const AssetContainer: React.FC<{
  children: React.ReactNode;
  header?: React.ReactNode;
}> = ({ children, header }) => {
  return (
    <AppPageLayout
      header={header}
      headerBorderVariant="ghost"
      headerSizeVariant="default"
      scrollable={false}
    >
      <div className="h-full flex flex-col w-full">{children}</div>
    </AppPageLayout>
  );
};
