import { useMemoizedFn } from '@/hooks';
import React from 'react';
import { SaveToDashboardDropdown } from '../dropdowns/SaveToDashboardDropdown';
import type { BusterMetric } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';
import { ASSET_ICONS } from '../config/assetIcons';
import { useRemoveMetricFromDashboard, useSaveMetricToDashboard } from '@/api/buster_rest/metrics';

const EMPTY_SELECTED_DASHBOARDS: BusterMetric['dashboards'] = [];

export const SaveMetricToDashboardButton: React.FC<{
  metricIds: string[];
  disabled?: boolean;
  selectedDashboards?: BusterMetric['dashboards'];
}> = React.memo(
  ({ metricIds, disabled = false, selectedDashboards = EMPTY_SELECTED_DASHBOARDS }) => {
    const { mutateAsync: saveMetricToDashboard } = useSaveMetricToDashboard();
    const { mutateAsync: removeMetricFromDashboard } = useRemoveMetricFromDashboard();

    const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
      await Promise.all(
        metricIds.map((metricId) => {
          return saveMetricToDashboard({ metricId, dashboardIds });
        })
      );
    });

    const onRemoveFromDashboard = useMemoizedFn(async (dashboardId: string) => {
      await Promise.all(
        metricIds.map((metricId) => {
          return removeMetricFromDashboard({ metricId, dashboardId });
        })
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
