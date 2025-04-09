import { useGetMetricsList } from '@/api/buster_rest/metrics';
import { useDebounce, useMemoizedFn } from '@/hooks';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { InputSelectModal, InputSelectModalProps } from '@/components/ui/modal/InputSelectModal';
import { formatDate } from '@/lib';
import { Button } from '@/components/ui/buttons';
import { useGetDashboardsList } from '@/api/buster_rest/dashboards';
import {
  useAddAndRemoveAssetsFromCollection,
  useGetCollection
} from '@/api/buster_rest/collections';
import { Text } from '@/components/ui/typography';
import { ASSET_ICONS } from '../config/assetIcons';
import pluralize from 'pluralize';
import { useSearch } from '@/api/buster_rest/search';
import { ShareAssetType } from '@/api/asset_interfaces/share';

export const AddToCollectionModal: React.FC<{
  open: boolean;
  onClose: () => void;
  collectionId: string;
}> = React.memo(({ open, onClose, collectionId }) => {
  const { data: collection, isFetched: isFetchedCollection } = useGetCollection(collectionId);
  const { mutateAsync: addAndRemoveAssetsFromCollection } = useAddAndRemoveAssetsFromCollection();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, { wait: 150 });
  const { data: searchResults } = useSearch({
    query: debouncedSearchTerm,
    asset_types: ['metric', 'dashboard'],
    num_results: 100
  });

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const columns = useMemo<InputSelectModalProps['columns']>(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (name, data: { type: 'metric' | 'dashboard' }) => {
          const Icon = data.type === 'metric' ? ASSET_ICONS.metrics : ASSET_ICONS.dashboards;
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-icon-color">
                <Icon />
              </span>
              <Text>{name}</Text>
            </div>
          );
        }
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
      searchResults?.map((asset) => ({
        id: asset.id,
        data: { name: asset.name, type: asset.type, updated_at: asset.updated_at }
      })) || []
    );
  }, [searchResults]);

  const handleAddAndRemoveMetrics = useMemoizedFn(async () => {
    const keyedAssets = rows.reduce<Record<string, { type: 'metric' | 'dashboard'; id: string }>>(
      (acc, asset) => {
        acc[asset.id] = { type: asset.data.type as 'metric' | 'dashboard', id: asset.id };
        return acc;
      },
      {}
    );

    const assets = selectedAssets.map<{ type: 'metric' | 'dashboard'; id: string }>((asset) => ({
      id: asset,
      type: keyedAssets[asset].type
    }));
    await addAndRemoveAssetsFromCollection({
      collectionId,
      assets
    });
    onClose();
  });

  const originalIds = useMemo(() => {
    return collection?.assets?.map((asset) => asset.id) || [];
  }, [collection?.assets]);

  const isSelectedChanged = useMemo(() => {
    const newIds = selectedAssets;
    return originalIds.length !== newIds.length || originalIds.some((id) => !newIds.includes(id));
  }, [originalIds, selectedAssets]);

  const emptyState = useMemo(() => {
    if (rows.length === 0) {
      return 'No assets found';
    }
    return undefined;
  }, [rows.length]);

  const footer: NonNullable<InputSelectModalProps['footer']> = useMemo(() => {
    return {
      left:
        selectedAssets.length > 0 ? (
          <Button variant="ghost" onClick={() => setSelectedAssets([])}>
            Clear selected
          </Button>
        ) : undefined,
      secondaryButton: {
        text: 'Cancel',
        onClick: onClose
      },
      primaryButton: {
        text:
          selectedAssets.length === 0
            ? 'Update collection'
            : `Add ${selectedAssets.length} ${pluralize('asset', selectedAssets.length)} to collection`,
        onClick: handleAddAndRemoveMetrics,
        disabled: !isSelectedChanged,
        tooltip: isSelectedChanged
          ? `Adding ${selectedAssets.length} assets`
          : 'No changes to update'
      }
    };
  }, [selectedAssets.length, isSelectedChanged, handleAddAndRemoveMetrics]);

  useLayoutEffect(() => {
    if (isFetchedCollection) {
      const assets = collection?.assets?.map((asset) => asset.id) || [];
      setSelectedAssets(assets);
    }
  }, [isFetchedCollection, collection?.assets]);

  return (
    <InputSelectModal
      width={665}
      open={open}
      onClose={onClose}
      columns={columns}
      rows={rows}
      onSelectChange={setSelectedAssets}
      selectedRowKeys={selectedAssets}
      footer={footer}
      emptyState={emptyState}
      searchText={searchTerm}
      handleSearchChange={setSearchTerm}
    />
  );
});
