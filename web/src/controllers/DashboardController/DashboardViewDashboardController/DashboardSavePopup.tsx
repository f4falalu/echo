import { useGetDashboard, useUpdateDashboard } from '@/api/buster_rest/dashboards';
import { SaveResetFilePopup } from '@/components/features/popups/SaveResetFilePopup';
import { useIsDashboardChanged } from '@/context/Dashboards';
import { useMemoizedFn } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import React from 'react';

export const DashboardSavePopup: React.FC<{ dashboardId: string }> = React.memo(
  ({ dashboardId }) => {
    const chatId = useChatLayoutContextSelector((x) => x.chatId);
    const { data: dashboardResponse } = useGetDashboard({ id: dashboardId });
    const { isDashboardChanged, onResetDashboardToOriginal } = useIsDashboardChanged({
      dashboardId
    });
    const { mutateAsync: onSaveDashboard, isPending: isSaving } = useUpdateDashboard({
      saveToServer: true,
      updateVersion: !chatId
    });

    const onSaveDashboardFileToServer = useMemoizedFn(() => {
      const dashboard = dashboardResponse?.dashboard;
      onSaveDashboard({
        id: dashboardId,
        name: dashboard?.name,
        description: dashboard?.description,
        config: dashboard?.config
      });
    });

    return (
      <SaveResetFilePopup
        open={isDashboardChanged}
        onReset={onResetDashboardToOriginal}
        onSave={onSaveDashboardFileToServer}
        isSaving={isSaving}
        showHotsKeys={false}
      />
    );
  }
);
