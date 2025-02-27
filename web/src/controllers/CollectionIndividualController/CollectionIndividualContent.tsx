'use client';

import { useBusterCollectionIndividualContextSelector } from '@/context/Collections';
import React, { useMemo, useState } from 'react';
import { AppMaterialIcons } from '@/components/ui';
import { Avatar } from '@/components/ui/avatar';
import { createBusterRoute, BusterRoutes } from '@/routes';
import { formatDate } from '@/lib';
import {
  BusterCollection,
  BusterCollectionItemAsset,
  BusterCollectionListItem
} from '@/api/asset_interfaces';
import { Text } from '@/components/ui';
import { ListEmptyStateWithButton } from '@/components/ui/list';
import { AddTypeModal } from '@/components/features/modals/AddTypeModal';
import { ShareAssetType } from '@/api/asset_interfaces';
import { useMemoizedFn } from 'ahooks';
import { BusterList, BusterListColumn, BusterListRow } from '@/components/ui/list';
import { CollectionIndividualSelectedPopup } from './CollectionsIndividualPopup';

export const CollectionIndividualContent: React.FC<{
  collection: BusterCollection | undefined;
  openAddTypeModal: boolean;
  setOpenAddTypeModal: (open: boolean) => void;
}> = React.memo(({ collection, openAddTypeModal, setOpenAddTypeModal }) => {
  const loadedAsset = collection?.id;

  const onCloseModal = useMemoizedFn(() => {
    setOpenAddTypeModal(false);
  });

  if (!loadedAsset) {
    return <></>;
  }

  const assetList = collection?.assets || [];

  return (
    <>
      <CollectionList
        assetList={assetList}
        openAddTypeModal={openAddTypeModal}
        setOpenAddTypeModal={setOpenAddTypeModal}
        selectedCollection={collection}
        loadedAsset={loadedAsset}
      />

      <AddTypeModal
        open={openAddTypeModal}
        onClose={onCloseModal}
        type="collection"
        collection={collection}
      />
    </>
  );
});
CollectionIndividualContent.displayName = 'CollectionIndividualContent';

const columns: BusterListColumn[] = [
  {
    dataIndex: 'name',
    title: 'Title',
    render: ({ asset_type, name }) => {
      const Icon = CollectionIconRecord[asset_type];
      return (
        <div className="flex w-full items-center space-x-2 overflow-hidden">
          {Icon}
          <Text type="secondary" ellipsis>
            {name}
          </Text>
        </div>
      );
    }
  },
  {
    dataIndex: 'updated_at',
    title: 'Last edited',
    width: 145,
    render: (v) => formatDate({ date: v, format: 'lll' })
  },
  {
    dataIndex: 'created_at',
    title: 'Created at',
    width: 145,
    render: (v) => formatDate({ date: v, format: 'lll' })
  },
  {
    dataIndex: 'created_by',
    title: 'Owner',
    width: 50,
    render: (created_by: BusterCollectionListItem['owner']) => {
      return (
        <Avatar image={created_by?.avatar_url || undefined} name={created_by?.name} size={18} />
      );
    }
  }
];

const CollectionList: React.FC<{
  assetList: BusterCollectionItemAsset[];
  openAddTypeModal: boolean;
  setOpenAddTypeModal: (value: boolean) => void;
  selectedCollection: BusterCollection;
  loadedAsset: string;
}> = React.memo(({ setOpenAddTypeModal, selectedCollection, assetList, loadedAsset }) => {
  const onBulkAddRemoveToCollection = useBusterCollectionIndividualContextSelector(
    (x) => x.onBulkAddRemoveToCollection
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const items: BusterListRow[] = useMemo(() => {
    return assetList.map((asset) => ({
      id: asset.id,
      link: createAssetLink(asset, selectedCollection.id),
      data: {
        ...asset,
        name: { name: asset.name || 'New ' + asset.asset_type, asset_type: asset.asset_type }
      }
    }));
  }, [assetList]);

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });

  const onDeleteClick = useMemoizedFn(async () => {
    const assets = assetList
      .filter((v) => !selectedRowKeys.includes(v.id))
      .map((v) => ({
        type: v.asset_type,
        id: v.id
      }));

    await onBulkAddRemoveToCollection({
      collectionId: selectedCollection.id,
      assets
    });
    setSelectedRowKeys([]);
  });

  const onOpenAddTypeModal = useMemoizedFn(() => {
    setOpenAddTypeModal(true);
  });

  return (
    <div className="relative flex h-full flex-col items-center">
      <BusterList
        rows={items}
        columns={columns}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
        emptyState={
          loadedAsset ? (
            <ListEmptyStateWithButton
              title="You haven’t saved anything to your collection yet."
              buttonText="Add to collection"
              description="As soon as you add metrics and dashboards to your collection, they will appear here."
              onClick={onOpenAddTypeModal}
            />
          ) : (
            <></>
          )
        }
      />

      <CollectionIndividualSelectedPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        onDeleteClick={onDeleteClick}
      />
    </div>
  );
});
CollectionList.displayName = 'CollectionList';

const CollectionIconRecord: Record<string, React.ReactNode> = {
  dashboard: <AppMaterialIcons icon="grid_view" />,
  metric: <AppMaterialIcons icon="monitoring" />
};

const createAssetLink = (asset: BusterCollectionItemAsset, collectionId: string) => {
  if (asset.asset_type === ShareAssetType.METRIC) {
    return createBusterRoute({
      route: BusterRoutes.APP_COLLECTIONS_ID_METRICS_ID,
      collectionId,
      metricId: asset.id
    });
  }

  if (asset.asset_type === 'dashboard') {
    return createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_ID,
      dashboardId: asset.id
    });
  }

  if (asset.asset_type === 'collection') {
    return createBusterRoute({
      route: BusterRoutes.APP_COLLECTIONS
    });
  }

  return '#';
};
