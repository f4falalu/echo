import type React from 'react';

import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';

export const AssetContainer: React.FC<{
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
}> = ({ children, header, scrollable = false }) => {
  return (
    <AppPageLayout
      header={header}
      headerBorderVariant="ghost"
      headerSizeVariant="default"
      scrollable={scrollable}
    >
      {children}
    </AppPageLayout>
  );
};
