import { AppDropdownSelect } from '@/components/ui/dropdown';
import { AppMaterialIcons } from '@/components/ui';
import { AppTooltip } from '@/components/ui/tooltip';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useBusterCollectionListContextSelector } from '@/context/Collections';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { useMemoizedFn } from 'ahooks';
import { Button } from 'antd';
import React, { useMemo } from 'react';
import type { BusterCollectionListItem } from '@/api/asset_interfaces';
import { NewCollectionModal } from '../Modals/NewCollectionModal';

export const SaveToCollectionsDropdown: React.FC<{
  children: React.ReactNode;
  selectedCollections: string[];
  onSaveToCollection: (collectionId: string[]) => Promise<void>;
  onRemoveFromCollection: (collectionId: string) => Promise<void>;
}> = React.memo(({ children, onRemoveFromCollection, onSaveToCollection, selectedCollections }) => {
  const collectionsList = useBusterCollectionListContextSelector((x) => x.collectionsList);
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const [openCollectionModal, setOpenCollectionModal] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);

  const items = useMemo(
    () =>
      (collectionsList || []).map((collection) => {
        return {
          key: collection.id,
          label: collection.name,
          onClick: () => onClickItem(collection),
          link: createBusterRoute({
            route: BusterRoutes.APP_COLLECTIONS_ID,
            collectionId: collection.id
          })
        };
      }),
    [collectionsList]
  );

  const onClickItem = useMemoizedFn((collection: BusterCollectionListItem) => {
    const isSelected = selectedCollections.some((id) => id === collection.id);
    if (isSelected) {
      onRemoveFromCollection(collection.id);
    } else {
      const allCollectionsAndSelected = selectedCollections.map((id) => id).concat(collection.id);
      onSaveToCollection(allCollectionsAndSelected);
    }
  });

  const onCollectionCreated = useMemoizedFn(async (collectionId: string) => {
    await onSaveToCollection([collectionId]);
    onChangePage({
      route: BusterRoutes.APP_COLLECTIONS_ID,
      collectionId
    });
  });

  const onCloseCollectionModal = useMemoizedFn(() => {
    setOpenCollectionModal(false);
    setShowDropdown(false);
  });

  const onOpenChange = useMemoizedFn((open: boolean) => {
    setShowDropdown(open);
  });

  const onClick = useMemoizedFn(() => {
    setOpenCollectionModal(true);
    setShowDropdown(false);
  });

  const memoizedButton = useMemo(() => {
    return (
      <Button
        type="text"
        block
        className="justify-start!"
        icon={<AppMaterialIcons icon="add" />}
        onClick={onClick}>
        New collection
      </Button>
    );
  }, [onClick]);

  return (
    <>
      <AppDropdownSelect
        trigger={['click']}
        placement="bottomRight"
        className="flex! h-fit! items-center"
        headerContent={'Save to a collection'}
        open={showDropdown}
        onOpenChange={onOpenChange}
        footerContent={memoizedButton}
        items={items}
        selectedItems={selectedCollections}>
        {showDropdown ? (
          <>{children}</>
        ) : (
          <AppTooltip title={showDropdown ? '' : 'Save to collection'}>{children} </AppTooltip>
        )}
      </AppDropdownSelect>

      <NewCollectionModal
        open={openCollectionModal}
        onClose={onCloseCollectionModal}
        useChangePage={false}
        onCollectionCreated={onCollectionCreated}
      />
    </>
  );
});

SaveToCollectionsDropdown.displayName = 'SaveToCollectionsDropdown';
