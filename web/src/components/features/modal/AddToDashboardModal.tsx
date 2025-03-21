import { useGetMetricsList } from '@/api/buster_rest/metrics';
import { useDebounceSearch, useMemoizedFn } from '@/hooks';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { InputSelectModal, InputSelectModalProps } from '@/components/ui/modal/InputSelectModal';
import { formatDate } from '@/lib';
import { Button } from '@/components/ui/buttons';
import { useAddMetricsToDashboard, useGetDashboard } from '@/api/buster_rest/dashboards';

export const AddToDashboardModal: React.FC<{
  open: boolean;
  onClose: () => void;
  dashboardId: string;
}> = React.memo(({ open, onClose, dashboardId }) => {
  const { data: dashboard, isFetched: isFetchedDashboard } = useGetDashboard(dashboardId);
  const { data: metrics, isFetched: isFetchedMetrics } = useGetMetricsList({});
  const { mutateAsync: addMetricsToDashboard } = useAddMetricsToDashboard();

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  const columns: InputSelectModalProps['columns'] = [
    {
      title: 'Title',
      dataIndex: 'title'
    },
    {
      title: 'Last edited',
      dataIndex: 'last_edited',
      width: 132,
      render: (value: string, x) => {
        return formatDate({
          date: value,
          format: 'lll'
        });
      }
    }
  ];

  const rows = useMemo(() => {
    return metrics.map((metric) => ({
      id: metric.id,
      data: metric
    }));
  }, [metrics.length]);

  const handleAddAndRemoveMetrics = useMemoizedFn(async () => {
    await addMetricsToDashboard({
      dashboardId: dashboardId,
      metricIds: selectedMetrics
    });
    onClose();
  });

  const onSelectChange = useMemoizedFn((items: string[]) => {
    setSelectedMetrics(items);
  });

  const isSelectedChanged = useMemo(() => {
    const originalIds = Object.keys(dashboard?.metrics || {});
    const newIds = selectedMetrics;
    return originalIds.length !== newIds.length || originalIds.some((id) => !newIds.includes(id));
  }, [dashboard?.metrics, selectedMetrics]);

  const emptyState = useMemo(() => {
    if (!isFetchedMetrics || !isFetchedDashboard) {
      return 'Loading metrics...';
    }
    if (rows.length === 0) {
      return 'No metrics found';
    }
    return undefined;
  }, [isFetchedMetrics, isFetchedDashboard, rows]);

  const footer: NonNullable<InputSelectModalProps['footer']> = useMemo(() => {
    return {
      left:
        selectedMetrics.length > 0 ? (
          <Button variant="ghost" onClick={() => setSelectedMetrics([])}>
            Clear selected
          </Button>
        ) : undefined,
      secondaryButton: {
        text: 'Cancel',
        onClick: onClose
      },
      primaryButton: {
        text: `Update metrics`,
        onClick: handleAddAndRemoveMetrics,
        disabled: !isSelectedChanged,
        tooltip: isSelectedChanged
          ? `Adding ${selectedMetrics.length} metrics`
          : 'No changes to update'
      }
    };
  }, [selectedMetrics.length, isSelectedChanged, handleAddAndRemoveMetrics]);

  useLayoutEffect(() => {
    if (isFetchedDashboard) {
      const metrics = Object.keys(dashboard?.metrics || {});
      setSelectedMetrics(metrics);
    }
  }, [isFetchedDashboard, dashboard?.metrics]);

  return (
    <InputSelectModal
      width={650}
      open={open}
      onClose={onClose}
      columns={columns}
      rows={rows}
      onSelectChange={onSelectChange}
      selectedRowKeys={selectedMetrics}
      footer={footer}
      emptyState={emptyState}
    />
  );
});
