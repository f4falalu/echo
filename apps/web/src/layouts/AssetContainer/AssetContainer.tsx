import type React from 'react';

import { AppPageLayout, type AppPageLayoutProps } from '@/components/ui/layouts/AppPageLayout';
import { useIsChatMode } from '@/context/Chats/useMode';

export const AssetContainer: React.FC<{
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  headerBorderVariant?: AppPageLayoutProps['headerBorderVariant'];
}> = ({ children, header, scrollable = false, headerBorderVariant: headerBorderVariantProp }) => {
  const isChatMode = useIsChatMode();
  const backgroundColor = isChatMode ? 'bg-panel-background' : 'bg-page-background';
  const headerBorderVariant: AppPageLayoutProps['headerBorderVariant'] =
    headerBorderVariantProp ?? (isChatMode ? 'ghost' : 'default');

  return (
    <AppPageLayout
      header={header}
      headerSizeVariant="default"
      scrollable={scrollable}
      mainClassName={backgroundColor}
      headerClassName={backgroundColor}
      headerBorderVariant={headerBorderVariant}
    >
      {children}
    </AppPageLayout>
  );
};
