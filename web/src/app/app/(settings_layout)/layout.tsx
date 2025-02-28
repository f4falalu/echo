import { AppLayout } from '@/components/ui/layouts/AppLayout';
import { getAppSplitterLayout } from '@/components/ui/layouts/AppSplitter';
import { SettingsSidebar } from '@/controllers/Sidebars/SettingsSidebar';
import React from 'react';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const defaultLayout = await getAppSplitterLayout('app-layout', ['230px', 'auto']);

  return (
    <AppLayout defaultLayout={defaultLayout} sidebar={<SettingsSidebar />}>
      {children}
    </AppLayout>
  );
}
