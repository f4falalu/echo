'use client';

import React, { useMemo } from 'react';
import { AppContentHeader } from '@/components/ui/layouts';
import {
  canEditCollection,
  useBusterCollectionIndividualContextSelector
} from '@/context/Collections';
import { Button, Dropdown, MenuProps } from 'antd';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { AppMaterialIcons } from '@/components/ui';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { FavoriteStar } from '@/components/features/list/FavoriteStar';
import { ShareMenu } from '@/components/features/ShareMenu';
import { BusterCollection, ShareAssetType } from '@/api/asset_interfaces';
import { Text } from '@/components/ui';
import { useAntToken } from '@/styles/useAntToken';
import { useMemoizedFn } from 'ahooks';
import { measureTextWidth } from '@/lib/canvas';
import { type BreadcrumbItem, Breadcrumb } from '@/components/ui/breadcrumb';

export const CollectionsIndividualHeader: React.FC<{
  openAddTypeModal: boolean;
  setOpenAddTypeModal: (open: boolean) => void;
  collection: BusterCollection | undefined;
  isFetched: boolean;
}> = ({ openAddTypeModal, setOpenAddTypeModal, collection, isFetched }) => {
  const createPageLink = useAppLayoutContextSelector((s) => s.createPageLink);
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
        <Text
          ellipsis={{
            tooltip: true
          }}>
          {collectionTitle}
        </Text>
      )
    };
  }, [collectionTitle, editingTitle, textWidth.width, onSetTitleValue, setEditingTitle, isFetched]);

  return (
    <AppContentHeader>
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
    </AppContentHeader>
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
        <Button type="text" icon={<AppMaterialIcons icon="share_windows" size={16} />} />
      </ShareMenu>
      <Button icon={<AppMaterialIcons icon="add" />} onClick={onButtonClick} type="default">
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
  const token = useAntToken();

  const items: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'delete',
        label: 'Delete collection',
        icon: <AppMaterialIcons icon="delete" />,
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
        key: 'rename',
        label: 'Rename collection',
        icon: <AppMaterialIcons icon="edit" />,
        onClick: () => {
          setEditingTitle(true);
        }
      }
    ],
    [collection.id, deleteCollection, onChangePage, setEditingTitle]
  );

  const memoizedMenu = useMemo(() => {
    return {
      items
    };
  }, [items]);

  return (
    <div className="flex items-center">
      <Dropdown trigger={['click']} menu={memoizedMenu}>
        <Button
          type="text"
          icon={
            <AppMaterialIcons
              style={{
                color: token.colorIcon
              }}
              icon="more_horiz"
              size={16}
            />
          }></Button>
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
