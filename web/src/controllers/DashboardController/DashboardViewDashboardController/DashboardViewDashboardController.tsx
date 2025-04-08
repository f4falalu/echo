'use client';

import React from 'react';
import { DashboardEditTitles } from './DashboardEditTitle';
import { DashboardContentController } from './DashboardContentController';
import { useGetDashboard, useUpdateDashboardConfig } from '@/api/buster_rest/dashboards';
import { useDashboardContentStore, useIsDashboardChanged } from '@/context/Dashboards';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { useIsDashboardReadOnly } from '@/context/Dashboards/useIsDashboardReadOnly';

export const DashboardViewDashboardController: React.FC<{
  dashboardId: string;
  chatId: string | undefined;
  readOnly?: boolean;
}> = ({ dashboardId, chatId, readOnly: readOnlyProp = false }) => {
  const {
    data: dashboardResponse,
    isFetched,
    isError,
    error
  } = useGetDashboard({ id: dashboardId });

  const { mutateAsync: onUpdateDashboardConfig } = useUpdateDashboardConfig();
  const onOpenAddContentModal = useDashboardContentStore((x) => x.onOpenAddContentModal);
  const { isDashboardChanged, onResetDashboardToOriginal } = useIsDashboardChanged({
    dashboardId
  });

  const metrics = dashboardResponse?.metrics;
  const dashboard = dashboardResponse?.dashboard;
  const { isReadOnly } = useIsDashboardReadOnly({
    dashboardId,
    readOnly: readOnlyProp
  });

  if (isError) {
    return (
      <div className="p-10">
        <StatusCard variant="danger" title="Error" message={error?.message || ''} />
      </div>
    );
  }

  if (!isFetched) {
    return <></>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex h-full flex-col space-y-3 p-10">
        <DashboardEditTitles
          dashboardId={dashboardId}
          readOnly={isReadOnly}
          title={dashboardResponse?.dashboard?.name || ''}
          description={dashboardResponse?.dashboard?.description || ''}
        />

        <DashboardContentController
          metrics={metrics}
          dashboard={dashboard}
          chatId={chatId}
          onUpdateDashboardConfig={onUpdateDashboardConfig}
          onOpenAddContentModal={onOpenAddContentModal}
          readOnly={isReadOnly}
        />
      </div>
    </ScrollArea>
  );
};
