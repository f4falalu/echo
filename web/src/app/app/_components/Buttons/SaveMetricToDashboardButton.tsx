import { useDashboardContextSelector } from '@/context/Dashboards';
import { useBusterMetricsContextSelector } from '@/context/Metrics';
import { useMemoizedFn, useMount, useUnmount } from 'ahooks';
import React from 'react';
import { SaveToDashboardDropdown } from '../Dropdowns/SaveToDashboardDropdown';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components/icons';
import type { BusterMetric } from '@/api/asset_interfaces';

const EMPTY_SELECTED_DASHBOARDS: BusterMetric['dashboards'] = [];

export const SaveMetricToDashboardButton: React.FC<{
  metricIds: string[];
  disabled?: boolean;
  selectedDashboards?: BusterMetric['dashboards'];
}> = React.memo(
  ({ metricIds, disabled = false, selectedDashboards = EMPTY_SELECTED_DASHBOARDS }) => {
    const saveMetricToDashboard = useBusterMetricsContextSelector(
      (state) => state.saveMetricToDashboard
    );
    const removeMetricFromDashboard = useBusterMetricsContextSelector(
      (state) => state.removeMetricFromDashboard
    );
    const initDashboardsList = useDashboardContextSelector((state) => state.initDashboardsList);
    const unsubscribeFromDashboardsList = useDashboardContextSelector(
      (state) => state.unsubscribeFromDashboardsList
    );

    const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
      console.warn('TODO: save metric to dashboard', dashboardIds);
      //  await saveMetricToDashboard({ metricId, dashboardIds });
    });

    const onRemoveFromDashboard = useMemoizedFn(async (dashboardId: string) => {
      console.warn('TODO: remove metric from dashboard', dashboardId);
      //  return await removeMetricFromDashboard({ metricId, dashboardId, useConfirmModal: false });
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
