import { useDashboardContextSelector } from '@/context/Dashboards';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { useMemoizedFn, useMount, useUnmount } from 'ahooks';
import React from 'react';
import { SaveToDashboardDropdown } from '../Dropdowns/SaveToDashboardDropdown';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components/icons';
import { BusterMetricAsset } from '@/api/buster_rest/metric';

const EMPTY_SELECTED_DASHBOARDS: BusterMetricAsset['dashboards'] = [];

export const SaveMetricToDashboardButton: React.FC<{
  metricIds: string[];
  disabled?: boolean;
  selectedDashboards?: BusterMetricAsset['dashboards'];
}> = React.memo(
  ({ metricIds, disabled = false, selectedDashboards = EMPTY_SELECTED_DASHBOARDS }) => {
    const saveThreadToDashboard = useBusterThreadsContextSelector(
      (state) => state.saveThreadToDashboard
    );
    const removeThreadFromDashboard = useBusterThreadsContextSelector(
      (state) => state.removeThreadFromDashboard
    );
    const initDashboardsList = useDashboardContextSelector((state) => state.initDashboardsList);
    const unsubscribeFromDashboardsList = useDashboardContextSelector(
      (state) => state.unsubscribeFromDashboardsList
    );

    const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
      console.warn('TODO: save metric to dashboard', dashboardIds);
      //  await saveThreadToDashboard({ threadId, dashboardIds });
    });

    const onRemoveFromDashboard = useMemoizedFn(async (dashboardId: string) => {
      console.warn('TODO: remove metric from dashboard', dashboardId);
      //  return await removeThreadFromDashboard({ threadId, dashboardId, useConfirmModal: false });
    });

    const onClick = useMemoizedFn(() => {
      initDashboardsList();
    });

    useMount(() => {
      setTimeout(() => {
        initDashboardsList();
      }, 8000);
    });

    useUnmount(() => {
      unsubscribeFromDashboardsList();
    });

    return (
      <SaveToDashboardDropdown
        selectedDashboards={selectedDashboards}
        onSaveToDashboard={onSaveToDashboard}
        onRemoveFromDashboard={onRemoveFromDashboard}>
        <Button
          type="text"
          disabled={disabled}
          icon={<AppMaterialIcons icon="dashboard_customize" />}
          onClick={onClick}
        />
      </SaveToDashboardDropdown>
    );
  }
);

SaveMetricToDashboardButton.displayName = 'SaveMetricToDashboardButton';
