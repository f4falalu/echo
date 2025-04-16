import { useMemoizedFn } from '@/hooks';
import React from 'react';
import { SaveToDashboardDropdown } from '../dropdowns/SaveToDashboardDropdown';
import { Button } from '@/components/ui/buttons';
import { ASSET_ICONS } from '../config/assetIcons';
import {
  useRemoveMetricsFromDashboard,
  useAddMetricsToDashboard
} from '@/api/buster_rest/dashboards';
import { AppTooltip } from '@/components/ui/tooltip';

export const SaveMetricToDashboardButton: React.FC<{
  metricIds: string[];
  disabled?: boolean;
  selectedDashboards: string[];
}> = React.memo(({ metricIds, disabled = false, selectedDashboards }) => {
  const { mutateAsync: saveMetricsToDashboard } = useAddMetricsToDashboard();
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
      <AppTooltip title={'Save to dashboard'}>
        <Button variant="ghost" disabled={disabled} prefix={<ASSET_ICONS.dashboardAdd />} />
      </AppTooltip>
    </SaveToDashboardDropdown>
  );
});

SaveMetricToDashboardButton.displayName = 'SaveMetricToDashboardButton';
