import { useGetMetricsList } from '@/api/buster_rest/metrics';
import { AppModal } from '@/components/ui/modal';
import { useDebounceSearch } from '@/hooks';
import React, { useState } from 'react';
import { BusterList } from '@/components/ui/list';
import { Input } from '@/components/ui/inputs';

export const AddToDashboardModal: React.FC<{
  open: boolean;
  onClose: () => void;
  dashboardId: string;
}> = React.memo(({ open, onClose, dashboardId }) => {
  const { data: metrics, isFetched: isFetchedMetrics } = useGetMetricsList({});
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  const { filteredItems, handleSearchChange } = useDebounceSearch({
    items: metrics || [],
    searchPredicate: (item, searchText) => {
      return item.title.toLowerCase().includes(searchText.toLowerCase());
    }
  });

  const columns = [
    {
      title: 'Metric',
      dataIndex: 'title',
      width: 300
    }
  ];

  const rows = filteredItems.map((metric) => ({
    id: metric.id,
    data: {
      title: metric.title
    }
  }));

  const handleAddMetrics = async () => {
    // TODO: Implement the API call to add metrics to dashboard
    console.log('Adding metrics:', selectedMetrics);
    onClose();
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      header={{
        title: 'Add Metrics to Dashboard',
        description: 'Select metrics to add to your dashboard'
      }}
      footer={{
        primaryButton: {
          text: 'Add Selected Metrics',
          onClick: handleAddMetrics,
          disabled: selectedMetrics.length === 0
        },
        secondaryButton: {
          text: 'Cancel',
          onClick: onClose
        }
      }}>
      <div className="flex flex-col gap-4">
        <Input
          placeholder="Search metrics..."
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <div className="h-[400px]">
          <BusterList
            columns={columns}
            rows={rows}
            selectedRowKeys={selectedMetrics}
            onSelectChange={setSelectedMetrics}
            emptyState={
              !isFetchedMetrics
                ? 'Loading metrics...'
                : filteredItems.length === 0
                  ? 'No metrics found'
                  : undefined
            }
          />
        </div>
      </div>
    </AppModal>
  );
});
