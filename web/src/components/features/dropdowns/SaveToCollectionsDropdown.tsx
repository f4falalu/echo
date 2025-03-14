import { Dropdown, type DropdownItem, type DropdownProps } from '@/components/ui/dropdown';
import { AppTooltip } from '@/components/ui/tooltip';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { useMemoizedFn } from '@/hooks';
import React, { useMemo } from 'react';
import type { BusterCollectionListItem } from '@/api/asset_interfaces/collection';
import { NewCollectionModal } from '../modal/NewCollectionModal';
import { Plus } from '@/components/ui/icons';
import { Button } from '@/components/ui/buttons';
import { useGetCollectionsList } from '@/api/buster_rest/collections';

export const SaveToCollectionsDropdown: React.FC<{
  children: React.ReactNode;
  selectedCollections: string[];
  onSaveToCollection: (collectionId: string[]) => Promise<void>;
  onRemoveFromCollection: (collectionId: string) => Promise<void>;
}> = React.memo(({ children, onRemoveFromCollection, onSaveToCollection, selectedCollections }) => {
  const { data: collectionsList } = useGetCollectionsList({});
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const [openCollectionModal, setOpenCollectionModal] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);

  const items: DropdownProps['items'] = useMemo(() => {
    const collectionsItems = (collectionsList || []).map<DropdownItem>((collection) => {
      return {
        value: collection.id,
        label: collection.name,
        selected: selectedCollections.some((id) => id === collection.id),
        onClick: () => onClickItem(collection),
        link: createBusterRoute({
          route: BusterRoutes.APP_COLLECTIONS_ID,
          collectionId: collection.id
        })
      };
    });

    return [
      ...collectionsItems,
      {
        value: 'new',
        label: 'New collection'
      }
    ];
  }, [collectionsList, selectedCollections]);

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
    console.log('open', open);
  });

  const onClick = useMemoizedFn(() => {
    setOpenCollectionModal(true);
    setShowDropdown(false);
  });

  const memoizedButton = useMemo(() => {
    return (
      <Button variant="ghost" block className="justify-start!" prefix={<Plus />} onClick={onClick}>
        New collection
      </Button>
    );
  }, [onClick]);

  return (
    <>
      <Dropdown
        side="bottom"
        align="start"
        menuHeader={'Save to a collection'}
        onOpenChange={onOpenChange}
        footerContent={memoizedButton}
        items={items}>
        <div>
          <AppTooltip title={showDropdown ? '' : 'Save to collection'}>{children} </AppTooltip>
        </div>
      </Dropdown>

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
