import { useBusterDashboardListByFilter } from '@/context/Dashboards';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { useMemoizedFn, useMount } from 'ahooks';
import React from 'react';
import { SaveToDashboardDropdown } from '../Dropdowns/SaveToDashboardDropdown';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components/ui';
import type { BusterMetric } from '@/api/asset_interfaces';

const EMPTY_SELECTED_DASHBOARDS: BusterMetric['dashboards'] = [];

export const SaveMetricToDashboardButton: React.FC<{
  metricIds: string[];
  disabled?: boolean;
  selectedDashboards?: BusterMetric['dashboards'];
}> = React.memo(
  ({ metricIds, disabled = false, selectedDashboards = EMPTY_SELECTED_DASHBOARDS }) => {
    const saveMetricToDashboard = useBusterMetricsIndividualContextSelector(
      (state) => state.saveMetricToDashboard
    );
    const removeMetricFromDashboard = useBusterMetricsIndividualContextSelector(
      (state) => state.removeMetricFromDashboard
    );

    const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
      console.warn('TODO: save metric to dashboard', dashboardIds);
      //  await saveMetricToDashboard({ metricId, dashboardIds });
    });

    const onRemoveFromDashboard = useMemoizedFn(async (dashboardId: string) => {
      console.warn('TODO: remove metric from dashboard', dashboardId);
      //  return await removeMetricFromDashboard({ metricId, dashboardId, useConfirmModal: false });
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
        />
      </SaveToDashboardDropdown>
    );
  }
);

SaveMetricToDashboardButton.displayName = 'SaveMetricToDashboardButton';
