import type React from 'react';
import { SidebarPrimary } from '@/components/features/sidebars/SidebarPrimary';
import { AppLayout, type LayoutSize } from '@/components/ui/layouts/AppLayout';

interface IPrimaryAppLayoutProps {
  children: React.ReactNode;
  initialLayout: LayoutSize | null;
  layoutId: string;
  defaultLayout: LayoutSize;
}

export const PrimaryAppLayout: React.FC<IPrimaryAppLayoutProps> = ({
  layoutId,
  children,
  initialLayout,
  defaultLayout,
}) => {
  return (
    <AppLayout
      autoSaveId={layoutId}
      defaultLayout={defaultLayout}
      initialLayout={initialLayout}
      sidebar={<SidebarPrimary />}
    >
      {children}
    </AppLayout>
  );
};
