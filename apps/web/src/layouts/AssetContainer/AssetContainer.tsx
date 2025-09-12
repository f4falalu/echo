import type React from 'react';

import { AppPageLayout, type AppPageLayoutProps } from '@/components/ui/layouts/AppPageLayout';

export const AssetContainer: React.FC<{
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  headerBorderVariant?: AppPageLayoutProps['headerBorderVariant'];
}> = ({ children, header, scrollable = false, headerBorderVariant = 'ghost' }) => {
  return (
    <AppPageLayout
      header={header}
      headerBorderVariant={headerBorderVariant}
      headerSizeVariant="default"
      scrollable={scrollable}
    >
      {children}
    </AppPageLayout>
  );
};
