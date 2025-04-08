'use client';

import React from 'react';
import { DashboardEditTitles } from './DashboardEditTitle';
import { DashboardContentController } from './DashboardContentController';
import {
  useGetDashboard,
  useUpdateDashboard,
  useUpdateDashboardConfig
} from '@/api/buster_rest/dashboards';
import { useDashboardContentStore } from '@/context/Dashboards';
import { ScrollArea } from '@/components/ui/scroll-area';
import { canEdit } from '@/lib/share';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';

export const DashboardViewDashboardController: React.FC<{
  dashboardId: string;
  chatId: string | undefined;
  readOnly?: boolean;
}> = ({ dashboardId, chatId, readOnly: readOnlyProp = false }) => {
  const isVersionHistoryMode = useChatLayoutContextSelector((x) => x.isVersionHistoryMode);
  const { data: dashboardResponse } = useGetDashboard({ id: dashboardId });
  const { mutateAsync: onUpdateDashboard } = useUpdateDashboard();
  const { mutateAsync: onUpdateDashboardConfig } = useUpdateDashboardConfig();
  const onOpenAddContentModal = useDashboardContentStore((x) => x.onOpenAddContentModal);

  const metrics = dashboardResponse?.metrics;
  const dashboard = dashboardResponse?.dashboard;
  const readOnly = readOnlyProp || !canEdit(dashboardResponse?.permission) || isVersionHistoryMode;

  return (
    <ScrollArea className="h-full">
      <div className="flex h-full flex-col space-y-3 p-10">
        <DashboardEditTitles
          onUpdateDashboard={onUpdateDashboard}
          dashboardId={dashboardId}
          readOnly={readOnly}
          title={dashboardResponse?.dashboard?.name || ''}
          description={dashboardResponse?.dashboard?.description || ''}
        />

        <DashboardContentController
          metrics={metrics}
          dashboard={dashboard}
          chatId={chatId}
          onUpdateDashboardConfig={onUpdateDashboardConfig}
          onOpenAddContentModal={onOpenAddContentModal}
          readOnly={readOnly}
        />
      </div>
    </ScrollArea>
  );
};
