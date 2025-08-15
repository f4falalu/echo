import type React from 'react';
import { SidebarPrimary } from '@/components/features/sidebars/SidebarPrimary';
import { AppLayout, type LayoutSize } from '@/components/ui/layouts/AppLayout';

export const PRIMARY_APP_LAYOUT_ID = 'primary-sidebar';

const DEFAULT_LAYOUT: LayoutSize = ['230px', 'auto'];

interface IPrimaryAppLayoutProps {
  children: React.ReactNode;
  initialLayout: LayoutSize | null;
}

export const PrimaryAppLayout: React.FC<IPrimaryAppLayoutProps> = ({ children, initialLayout }) => {
  return (
    <AppLayout
      autoSaveId={PRIMARY_APP_LAYOUT_ID}
      defaultLayout={DEFAULT_LAYOUT}
      initialLayout={initialLayout}
      sidebar={<SidebarPrimary />}
    >
      {children}
    </AppLayout>
  );
};
