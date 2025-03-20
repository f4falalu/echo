import { useMemoizedFn } from '@/hooks';
import React from 'react';
import { SaveToDashboardDropdown } from '../dropdowns/SaveToDashboardDropdown';
import type { BusterMetric } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';
import { ASSET_ICONS } from '../config/assetIcons';
import {
  useRemoveMetricsFromDashboard,
  useSaveMetricsToDashboard
} from '@/api/buster_rest/dashboards';

const EMPTY_SELECTED_DASHBOARDS: BusterMetric['dashboards'] = [];

export const SaveMetricToDashboardButton: React.FC<{
  metricIds: string[];
  disabled?: boolean;
  selectedDashboards?: BusterMetric['dashboards'];
}> = React.memo(
  ({ metricIds, disabled = false, selectedDashboards = EMPTY_SELECTED_DASHBOARDS }) => {
    const { mutateAsync: saveMetricsToDashboard } = useSaveMetricsToDashboard();
    const { mutateAsync: removeMetricsFromDashboard } = useRemoveMetricsFromDashboard();

    const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
      await Promise.all(
        dashboardIds.map((dashboardId) => saveMetricsToDashboard({ metricIds, dashboardId }))
      );
    });

    const onRemoveFromDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
      await Promise.all(
        dashboardIds.map((dashboardId) => removeMetricsFromDashboard({ metricIds, dashboardId }))
      );
    });

    return (
      <SaveToDashboardDropdown
        selectedDashboards={selectedDashboards}
        onSaveToDashboard={onSaveToDashboard}
        onRemoveFromDashboard={onRemoveFromDashboard}>
        <Button variant="ghost" disabled={disabled} prefix={<ASSET_ICONS.dashboardAdd />} />
      </SaveToDashboardDropdown>
    );
  }
);

SaveMetricToDashboardButton.displayName = 'SaveMetricToDashboardButton';
