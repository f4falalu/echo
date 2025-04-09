import { useDebounce, useMemoizedFn } from '@/hooks';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { InputSelectModal, InputSelectModalProps } from '@/components/ui/modal/InputSelectModal';
import { formatDate } from '@/lib';
import { Button } from '@/components/ui/buttons';
import { useAddAndRemoveMetricsFromDashboard, useGetDashboard } from '@/api/buster_rest/dashboards';
import { useSearch } from '@/api/buster_rest/search';

export const AddToDashboardModal: React.FC<{
  open: boolean;
  onClose: () => void;
  dashboardId: string;
}> = React.memo(({ open, onClose, dashboardId }) => {
  const { data: dashboard, isFetched: isFetchedDashboard } = useGetDashboard({ id: dashboardId });
  const { mutateAsync: addAndRemoveMetricsFromDashboard } = useAddAndRemoveMetricsFromDashboard();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, { wait: 150 });

  const { data: searchResults } = useSearch(
    {
      query: debouncedSearchTerm,
      asset_types: ['metric'],
      num_results: 100
    },
    { enabled: open }
  );

  const columns = useMemo<InputSelectModalProps['columns']>(
    () => [
      {
        title: 'Name',
        dataIndex: 'name'
      },
      {
        title: 'Updated',
        dataIndex: 'updated_at',
        width: 140,
        render: (value: string, x) => {
          return formatDate({
            date: value,
            format: 'lll'
          });
        }
      }
    ],
    []
  );

  const rows = useMemo(() => {
    return (
      searchResults?.map((result) => ({
        id: result.id,
        data: result
      })) || []
    );
  }, [searchResults]);

  const handleAddAndRemoveMetrics = useMemoizedFn(async () => {
    await addAndRemoveMetricsFromDashboard({
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
    if (!isFetchedDashboard) {
      return 'Loading metrics...';
    }
    if (rows.length === 0) {
      return 'No metrics found';
    }
    return undefined;
  }, [isFetchedDashboard, rows]);

  const addedMetricCount = useMemo(() => {
    return selectedMetrics.filter((id) => !Object.keys(dashboard?.metrics || {}).includes(id))
      .length;
  }, [dashboard?.metrics, selectedMetrics]);

  const removedMetricCount = useMemo(() => {
    return Object.keys(dashboard?.metrics || {}).filter((id) => !selectedMetrics.includes(id))
      .length;
  }, [dashboard?.metrics, selectedMetrics]);

  const primaryButtonText = useMemo(() => {
    if (!isFetchedDashboard) {
      return 'Loading metrics...';
    }

    const hasRemovedItems = removedMetricCount > 0;
    const hasAddedItems = addedMetricCount > 0;

    if (hasRemovedItems && hasAddedItems) {
      return `Update dashboard`;
    }

    if (hasRemovedItems) {
      return `Remove metrics`;
    }

    if (hasAddedItems) {
      return `Add metrics`;
    }

    return `Update dashboard`;
  }, [isFetchedDashboard, removedMetricCount, addedMetricCount]);

  const primaryButtonTooltipText = useMemo(() => {
    if (!isFetchedDashboard) {
      return '';
    }

    const hasRemovedItems = removedMetricCount > 0;
    const hasAddedItems = addedMetricCount > 0;
    const returnText: string[] = [];

    if (!hasRemovedItems && !hasAddedItems) {
      return 'No changes to update';
    }

    if (hasRemovedItems) {
      returnText.push(`Removing ${removedMetricCount}`);
    }

    if (hasAddedItems) {
      returnText.push(`Adding ${addedMetricCount}`);
    }

    return returnText.join(', ');
  }, [isFetchedDashboard, addedMetricCount, removedMetricCount]);

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
        text: primaryButtonText,
        onClick: handleAddAndRemoveMetrics,
        disabled: !isSelectedChanged,
        tooltip: primaryButtonTooltipText
      }
    };
  }, [
    selectedMetrics.length,
    primaryButtonTooltipText,
    primaryButtonText,
    isSelectedChanged,
    handleAddAndRemoveMetrics
  ]);

  useLayoutEffect(() => {
    if (isFetchedDashboard) {
      const metrics = Object.keys(dashboard?.metrics || {});
      setSelectedMetrics(metrics);
    }
  }, [isFetchedDashboard, dashboard?.metrics]);

  return (
    <InputSelectModal
      width={675}
      open={open}
      onClose={onClose}
      columns={columns}
      rows={rows}
      onSelectChange={onSelectChange}
      selectedRowKeys={selectedMetrics}
      footer={footer}
      emptyState={emptyState}
      searchText={searchTerm}
      handleSearchChange={setSearchTerm}
    />
  );
});
