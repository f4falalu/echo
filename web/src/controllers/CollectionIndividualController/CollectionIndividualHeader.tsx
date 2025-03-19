'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/buttons';
import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { FavoriteStar } from '@/components/features/list/FavoriteStar';
import { ShareMenu } from '@/components/features/ShareMenu';
import { BusterCollection, ShareAssetType } from '@/api/asset_interfaces';
import { useMemoizedFn } from '@/hooks';
import { type BreadcrumbItem, Breadcrumb } from '@/components/ui/breadcrumb';
import { Dots, Pencil, Plus, ShareAllRight, ShareRight, Trash } from '@/components/ui/icons';
import { useDeleteCollection, useUpdateCollection } from '@/api/buster_rest/collections';
import { canEdit } from '@/lib/share';

export const CollectionsIndividualHeader: React.FC<{
  openAddTypeModal: boolean;
  setOpenAddTypeModal: (open: boolean) => void;
  collection: BusterCollection | undefined;
  isFetched: boolean;
}> = ({ openAddTypeModal, setOpenAddTypeModal, collection, isFetched }) => {
  const { mutateAsync: updateCollection, isPending: isUpdatingCollection } = useUpdateCollection();

  const collectionTitle = collection?.name || 'No collection title';

  const onSetTitleValue = useMemoizedFn((value: string) => {
    updateCollection({
      id: collection?.id!,
      name: value
    });
  });

  return (
    <>
      <div className="flex h-full items-center space-x-3 overflow-hidden">
        <CollectionBreadcrumb collectionName={collectionTitle} />

        {collection && (
          <div className="flex items-center space-x-3">
            <ThreeDotDropdown collection={collection} />
            <FavoriteStar
              id={collection.id}
              type={ShareAssetType.COLLECTION}
              title={collectionTitle}
            />
          </div>
        )}
      </div>

      {collection && canEdit(collection.permission) && (
        <ContentRight
          collection={collection}
          openAddTypeModal={openAddTypeModal}
          setOpenAddTypeModal={setOpenAddTypeModal}
        />
      )}
    </>
  );
};

const ContentRight: React.FC<{
  collection: BusterCollection;
  openAddTypeModal: boolean;
  setOpenAddTypeModal: (open: boolean) => void;
}> = React.memo(({ collection, setOpenAddTypeModal, openAddTypeModal }) => {
  const onButtonClick = useMemoizedFn(() => {
    setOpenAddTypeModal(true);
  });

  return (
    <div className="flex items-center space-x-2">
      <ShareMenu
        assetType={ShareAssetType.COLLECTION}
        assetId={collection.id}
        shareAssetConfig={collection}>
        <Button variant="ghost" prefix={<ShareRight />} />
      </ShareMenu>
      <Button prefix={<Plus />} onClick={onButtonClick}>
        Add to collection
      </Button>
    </div>
  );
});
ContentRight.displayName = 'ContentRight';

const ThreeDotDropdown: React.FC<{
  collection: BusterCollection;
}> = React.memo(({ collection }) => {
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const { mutateAsync: deleteCollection, isPending: isDeletingCollection } = useDeleteCollection();

  const items: DropdownItems = useMemo(
    () => [
      {
        value: 'delete',
        label: 'Delete collection',
        icon: <Trash />,
        onClick: async () => {
          try {
            await deleteCollection({ id: collection.id });
            onChangePage({ route: BusterRoutes.APP_COLLECTIONS });
          } catch (error) {
            //
          }
        },
        disabled: isDeletingCollection
      },
      {
        value: 'rename',
        label: 'Rename collection',
        icon: <Pencil />,
        onClick: () => {
          //
        }
      }
    ],
    [collection.id, deleteCollection, onChangePage]
  );

  return (
    <div className="flex items-center">
      <Dropdown items={items}>
        <Button variant="ghost" prefix={<Dots />}></Button>
      </Dropdown>
    </div>
  );
});
ThreeDotDropdown.displayName = 'ThreeDotDropdown';

const CollectionBreadcrumb: React.FC<{
  collectionName: string;
}> = React.memo(({ collectionName }) => {
  const collectionBaseTitle = 'Collections';

  const items: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: collectionBaseTitle,
        route: { route: BusterRoutes.APP_COLLECTIONS }
      },
      { label: collectionName }
    ],
    [collectionBaseTitle, collectionName]
  );

  return <Breadcrumb items={items} />;
});
CollectionBreadcrumb.displayName = 'CollectionBreadcrumb';
