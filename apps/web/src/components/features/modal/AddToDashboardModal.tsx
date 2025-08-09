import React from 'react';
import { useAddAndRemoveMetricsFromDashboard, useGetDashboard } from '@/api/buster_rest/dashboards';
import { useMemoizedFn } from '@/hooks';
import { AddMetricModal } from './AddMetricModal';

export const AddToDashboardModal: React.FC<{
  open: boolean;
  onClose: () => void;
  dashboardId: string;
}> = React.memo(({ open, onClose, dashboardId }) => {
  const { data: dashboard, isFetched: isFetchedDashboard } = useGetDashboard({ id: dashboardId });
  const { mutateAsync: addAndRemoveMetricsFromDashboard } = useAddAndRemoveMetricsFromDashboard();

  const selectedMetrics = Object.values(dashboard?.metrics || {}).map((metric) => ({
    id: metric.id,
    name: metric.name
  }));

  const handleAddAndRemoveMetrics = useMemoizedFn(async () => {
    await addAndRemoveMetricsFromDashboard({
      dashboardId: dashboardId,
      metrics: selectedMetrics
    });
    onClose();
  });

  return (
    <AddMetricModal
      open={open}
      selectedMetrics={selectedMetrics}
      loading={!isFetchedDashboard}
      onAddMetrics={handleAddAndRemoveMetrics}
      onClose={onClose}
      saveButtonText="Update dashboard"
    />
  );
});

AddToDashboardModal.displayName = 'AddToDashboardModal';
