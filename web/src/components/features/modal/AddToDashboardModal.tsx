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
  const { data: searchResults } = useSearch({
    query: debouncedSearchTerm,
    asset_types: ['metric'],
    num_results: 100
  });

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
      width={665}
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
      className="data-[state=closed]:slide-out-to-top-[5%]! data-[state=open]:slide-in-from-top-[5%]! top-28 translate-y-0"
    />
  );
});
