import { AppContentHeader } from '@/components/layout/AppContentHeader';
import React from 'react';

export default function Layout({
  children,
  params: { threadId, dashboardId }
}: Readonly<{
  children: React.ReactNode;
  params: { threadId: string; dashboardId: string };
}>) {
  return <>{children}</>;
}
