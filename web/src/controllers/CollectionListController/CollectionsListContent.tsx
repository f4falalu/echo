'use client';

import React, { useMemo, useState } from 'react';
import { AppContent } from '@/components/ui';
import { Avatar } from '@/components/ui/avatar';
import { formatDate, makeHumanReadble } from '@/lib';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useBusterCollectionListContextSelector } from '@/context/Collections';
import {
  BusterList,
  BusterListColumn,
  BusterListRow,
  ListEmptyStateWithButton
} from '@/components/ui/list';
import { useMemoizedFn } from 'ahooks';
import { NewCollectionModal } from '@/components/features/modals/NewCollectionModal';
import { BusterCollectionListItem } from '@/api/asset_interfaces';
import { CollectionListSelectedPopup } from './CollectionListSelectedPopup';

export const CollectionsListContent: React.FC<{
  openNewCollectionModal: boolean;
  setOpenNewCollectionModal: (open: boolean) => void;
}> = React.memo(({ openNewCollectionModal, setOpenNewCollectionModal }) => {
  const isCollectionListFetched = useBusterCollectionListContextSelector(
    (x) => x.isCollectionListFetched
  );
  const collectionsList = useBusterCollectionListContextSelector((x) => x.collectionsList) || [];

  const onCloseNewCollectionModal = useMemoizedFn(() => {
    setOpenNewCollectionModal(false);
  });

  return (
    <>
      <AppContent>
        <CollectionList
          collectionsList={collectionsList}
          setOpenNewCollectionModal={setOpenNewCollectionModal}
          loadedCollections={isCollectionListFetched}
        />
      </AppContent>

      <NewCollectionModal
        open={openNewCollectionModal}
        onClose={onCloseNewCollectionModal}
        useChangePage={true}
      />
    </>
  );
});
CollectionsListContent.displayName = 'CollectionsListContent';

const columns: BusterListColumn[] = [
  { dataIndex: 'title', title: 'Title' },
  {
    dataIndex: 'createdAt',
    title: 'Created at',
    width: 145,
    render: (v) => formatDate({ date: v, format: 'lll' })
  },
  {
    dataIndex: 'lastEdited',
    title: 'Last edited',
    width: 145,
    render: (v) => formatDate({ date: v, format: 'lll' })
  },
  {
    dataIndex: 'sharing',
    title: 'Sharing',
    width: 55,
    render: (v) => makeHumanReadble(v || 'private')
  },
  {
    dataIndex: 'owner',
    title: 'Owner',
    width: 50,
    render: (owner: BusterCollectionListItem['owner']) => {
      return <Avatar image={owner?.avatar_url || undefined} name={owner?.name} size={18} />;
    }
  }
];

const CollectionList: React.FC<{
  collectionsList: BusterCollectionListItem[];
  setOpenNewCollectionModal: (v: boolean) => void;
  loadedCollections: boolean;
}> = React.memo(({ collectionsList, setOpenNewCollectionModal, loadedCollections }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const collections: BusterListRow[] = useMemo(() => {
    return collectionsList.map((collection) => {
      return {
        id: collection.id,
        link: createBusterRoute({
          route: BusterRoutes.APP_COLLECTIONS_ID,
          collectionId: collection.id
        }),
        data: {
          title: collection.name,
          lastEdited: collection.last_edited,
          createdAt: collection.created_at,
          owner: collection.owner,
          sharing: collection.sharing
        }
      };
    });
  }, [collectionsList]);

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });

  const onOpenNewCollectionModal = useMemoizedFn(() => {
    setOpenNewCollectionModal(true);
  });

  return (
    <div className="relative flex h-full flex-col items-center">
      <BusterList
        rows={collections}
        columns={columns}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
        emptyState={
          loadedCollections ? (
            <ListEmptyStateWithButton
              title="You don’t have any collections yet."
              buttonText="Create a collection"
              description="Collections help you organize your metrics and dashboards. Collections will appear here."
              onClick={onOpenNewCollectionModal}
            />
          ) : (
            <></>
          )
        }
      />

      <CollectionListSelectedPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
      />
    </div>
  );
});
CollectionList.displayName = 'CollectionList';
