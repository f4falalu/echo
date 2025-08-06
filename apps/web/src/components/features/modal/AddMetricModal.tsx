import React, { useLayoutEffect, useMemo, useState } from 'react';
import { useSearch } from '@/api/buster_rest/search';
import { Button } from '@/components/ui/buttons';
import {
  InputSelectModal,
  type InputSelectModalProps
} from '@/components/ui/modal/InputSelectModal';
import { useDebounce, useMemoizedFn } from '@/hooks';
import { formatDate } from '@/lib';
import type { BusterSearchResult } from '@/api/asset_interfaces/search';

export const AddMetricModal: React.FC<{
  open: boolean;
  selectedMetrics: { id: string; name: string }[];
  loading: boolean;
  selectionMode?: 'single' | 'multiple';
  onClose: () => void;
  onAddMetrics: (metrics: { id: string; name: string }[]) => Promise<void>;
}> = React.memo(
  ({
    open,
    selectionMode = 'multiple',
    selectedMetrics: selectedMetricsProp,
    loading,
    onAddMetrics,
    onClose
  }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMetrics, setSelectedMetrics] = useState<{ id: string; name: string }[]>([]);
    const debouncedSearchTerm = useDebounce(searchTerm, { wait: 175 });

    const selectedMetricsIds = selectedMetricsProp.map((metric) => metric.id);

    const { data: searchResults } = useSearch(
      {
        query: debouncedSearchTerm,
        asset_types: ['metric'],
        num_results: 100
      },
      { enabled: true }
    );

    const columns = useMemo<InputSelectModalProps<BusterSearchResult>['columns']>(
      () => [
        {
          title: 'Name',
          dataIndex: 'name'
        },
        {
          title: 'Updated',
          dataIndex: 'updated_at',
          width: 140,
          render: (value) => {
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
          dataTestId: `item-${result.id}`,
          data: result
        })) || []
      );
    }, [searchResults]);

    const handleAddAndRemoveMetrics = useMemoizedFn(async () => {
      await onAddMetrics(selectedMetrics);
      onClose();
    });

    const onSelectChange = useMemoizedFn((items: string[]) => {
      // Handle single selection mode - only allow one item to be selected
      let finalItems = items;
      if (selectionMode === 'single' && items.length > 1) {
        // Take only the last selected item (the most recent selection)
        finalItems = [items[items.length - 1]];
      }

      const itemsWithName = finalItems.map((id) => {
        const item = rows.find((row) => row.id === id);
        return {
          id: id,
          name: item?.data?.name || id
        };
      });

      setSelectedMetrics(itemsWithName);
    });

    const isSelectedChanged = useMemo(() => {
      const originalIds = selectedMetricsIds;
      const newIds = selectedMetricsIds;
      return originalIds.length !== newIds.length || originalIds.some((id) => !newIds.includes(id));
    }, [selectedMetricsIds, selectedMetricsIds]);

    const emptyState = useMemo(() => {
      if (loading) {
        return 'Loading metrics...';
      }
      if (rows.length === 0) {
        return 'No metrics found';
      }
      return undefined;
    }, [loading, rows]);

    const addedMetricCount = useMemo(() => {
      return selectedMetricsIds.filter((id) => !rows.some((row) => row.id === id)).length;
    }, [selectedMetricsIds, rows]);

    const removedMetricCount = useMemo(() => {
      return selectedMetricsIds.filter((id) => !rows.some((row) => row.id === id)).length;
    }, [selectedMetricsIds, rows]);

    const primaryButtonText = useMemo(() => {
      if (loading) {
        return 'Loading metrics...';
      }

      const hasRemovedItems = removedMetricCount > 0;
      const hasAddedItems = addedMetricCount > 0;

      if (hasRemovedItems && hasAddedItems) {
        return 'Update dashboard';
      }

      if (hasRemovedItems) {
        return selectionMode === 'single' ? 'Remove metric' : 'Remove metrics';
      }

      if (hasAddedItems) {
        return selectionMode === 'single' ? 'Add metric' : 'Add metrics';
      }

      return 'Update dashboard';
    }, [loading, removedMetricCount, addedMetricCount, selectionMode]);

    const primaryButtonTooltipText = useMemo(() => {
      if (loading) {
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
    }, [loading, addedMetricCount, removedMetricCount]);

    const footer: NonNullable<InputSelectModalProps['footer']> = useMemo(() => {
      return {
        left:
          selectedMetrics.length > 0 ? (
            <Button variant="ghost" onClick={() => setSelectedMetrics([])}>
              {selectionMode === 'single' ? 'Clear selection' : 'Clear selected'}
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
      handleAddAndRemoveMetrics,
      selectionMode,
      onClose
    ]);

    useLayoutEffect(() => {
      if (!loading) {
        setSelectedMetrics(selectedMetricsProp);
      }
    }, [loading, rows]);

    return (
      <InputSelectModal
        width={675}
        open={open}
        onClose={onClose}
        columns={columns}
        rows={rows}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedMetricsIds}
        footer={footer}
        emptyState={emptyState}
        searchText={searchTerm}
        handleSearchChange={setSearchTerm}
        showSelectAll={selectionMode === 'multiple'}
      />
    );
  }
);

AddMetricModal.displayName = 'AddMetricModal';
