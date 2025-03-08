'use client';

import React, { useMemo } from 'react';
import {
  canEditCollection,
  useBusterCollectionIndividualContextSelector
} from '@/context/Collections';
import { Button } from '@/components/ui/buttons';
import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { FavoriteStar } from '@/components/features/list/FavoriteStar';
import { ShareMenu } from '@/components/features/ShareMenu';
import { BusterCollection, ShareAssetType } from '@/api/asset_interfaces';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { measureTextWidth } from '@/lib/canvas';
import { type BreadcrumbItem, Breadcrumb } from '@/components/ui/breadcrumb';
import { Dots, Pencil, Plus, ShareAllRight, Trash } from '@/components/ui/icons';

export const CollectionsIndividualHeader: React.FC<{
  openAddTypeModal: boolean;
  setOpenAddTypeModal: (open: boolean) => void;
  collection: BusterCollection | undefined;
  isFetched: boolean;
}> = ({ openAddTypeModal, setOpenAddTypeModal, collection, isFetched }) => {
  const updateCollection = useBusterCollectionIndividualContextSelector((x) => x.updateCollection);
  const [editingTitle, setEditingTitle] = React.useState(false);

  const collectionTitle = collection?.name || 'No collection title';

  const textWidth = useMemo(() => {
    return measureTextWidth(collectionTitle);
  }, [collectionTitle, editingTitle]);

  const onSetTitleValue = useMemoizedFn((value: string) => {
    updateCollection({
      id: collection?.id!,
      name: value
    });
  });

  const collectionItemBreadcrumb = useMemo(() => {
    if (!isFetched) return { title: '' };
    return {
      title: editingTitle ? (
        <EditableTitle
          level={5}
          editing={editingTitle}
          style={{ width: textWidth.width }}
          onSetValue={onSetTitleValue}
          onChange={onSetTitleValue}
          onEdit={setEditingTitle}
          className="w-full">
          {collectionTitle}
        </EditableTitle>
      ) : (
        <Text truncate>{collectionTitle}</Text>
      )
    };
  }, [collectionTitle, editingTitle, textWidth.width, onSetTitleValue, setEditingTitle, isFetched]);

  return (
    <div className="flex h-full w-full items-center justify-between space-x-3 overflow-hidden">
      <div className="flex h-full items-center space-x-1 overflow-hidden">
        <CollectionBreadcrumb collectionName={collectionTitle} />

        {collection && (
          <div className="flex items-center space-x-0">
            <ThreeDotDropdown collection={collection} setEditingTitle={setEditingTitle} />

            <FavoriteStar
              id={collection.id}
              type={ShareAssetType.COLLECTION}
              title={collectionTitle}
            />
          </div>
        )}
      </div>

      {collection && canEditCollection(collection) && (
        <ContentRight
          collection={collection}
          openAddTypeModal={openAddTypeModal}
          setOpenAddTypeModal={setOpenAddTypeModal}
        />
      )}
    </div>
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
        <Button variant="ghost" prefix={<ShareAllRight />} />
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
  setEditingTitle: (editing: boolean) => void;
}> = React.memo(({ collection, setEditingTitle }) => {
  const deleteCollection = useBusterCollectionIndividualContextSelector((x) => x.deleteCollection);
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);

  const items: DropdownItems = useMemo(
    () => [
      {
        value: 'delete',
        label: 'Delete collection',
        icon: <Trash />,
        onClick: async () => {
          try {
            await deleteCollection(collection.id);
            onChangePage({ route: BusterRoutes.APP_COLLECTIONS });
          } catch (error) {
            //
          }
        }
      },
      {
        value: 'rename',
        label: 'Rename collection',
        icon: <Pencil />,
        onClick: () => {
          setEditingTitle(true);
        }
      }
    ],
    [collection.id, deleteCollection, onChangePage, setEditingTitle]
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
