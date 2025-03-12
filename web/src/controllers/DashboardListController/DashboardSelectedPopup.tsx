import React, { useState } from 'react';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/buttons';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { SaveToCollectionsDropdown } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { useBusterDashboardContextSelector } from '@/context/Dashboards';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { Dots, Star, Trash, Xmark } from '@/components/ui/icons';

export const DashboardSelectedOptionPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  hasSelected: boolean;
}> = ({ selectedRowKeys, onSelectChange, hasSelected }) => {
  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <CollectionsButton
          key="collections"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />,
        <DeleteButton
          key="delete"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />,
        <ThreeDotButton
          key="three-dot"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />
      ]}
      show={hasSelected}
    />
  );
};

const CollectionsButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { openInfoMessage } = useBusterNotifications();
  const onAddToCollection = useBusterDashboardContextSelector((state) => state.onAddToCollection);
  const onRemoveFromCollection = useBusterDashboardContextSelector(
    (state) => state.onRemoveFromCollection
  );

  const [selectedCollections, setSelectedCollections] = useState<
    Parameters<typeof SaveToCollectionsDropdown>[0]['selectedCollections']
  >([]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    setSelectedCollections(collectionIds);
    console.warn('TODO: save to collection', collectionIds);
    const allSaves: Promise<void>[] = selectedRowKeys.map((dashboardId) => {
      return onAddToCollection({
        dashboardId,
        collectionId: collectionIds
      });
    });
    await Promise.all(allSaves);
    openInfoMessage('Dashboards saved to collections');
  });

  const onRemoveFromCollectionPreflight = useMemoizedFn(async (collectionId: string) => {
    setSelectedCollections((prev) => prev.filter((id) => id !== collectionId));
    const allRemoves = selectedRowKeys.map((dashboardId) => {
      return onRemoveFromCollection({ dashboardId, collectionId });
    });

    await Promise.all(allRemoves);
    openInfoMessage('Dashboards removed from collections');
  });

  return (
    <SaveToCollectionsDropdown
      onSaveToCollection={onSaveToCollection}
      onRemoveFromCollection={onRemoveFromCollectionPreflight}
      selectedCollections={selectedCollections}>
      <Button prefix={<ASSET_ICONS.collections />} type="button">
        Collections
      </Button>
    </SaveToCollectionsDropdown>
  );
};

const DeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const onDeleteDashboard = useBusterDashboardContextSelector((state) => state.onDeleteDashboard);
  const { openConfirmModal } = useBusterNotifications();

  const onDeleteClick = useMemoizedFn(async () => {
    openConfirmModal({
      title: 'Delete dashboard',
      content: 'Are you sure you want to delete these dashboards?',
      onOk: async () => {
        await onDeleteDashboard(selectedRowKeys, true);
        onSelectChange([]);
      }
    });
  });

  return (
    <Button prefix={<Trash />} onClick={onDeleteClick}>
      Delete
    </Button>
  );
};

const ThreeDotButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const bulkEditFavorites = useUserConfigContextSelector((state) => state.bulkEditFavorites);
  const userFavorites = useUserConfigContextSelector((state) => state.userFavorites);

  const dropdownOptions: DropdownItems = [
    {
      label: 'Add to favorites',
      icon: <Star />,
      value: 'add-to-favorites',
      onClick: async () => {
        const allFavorites: string[] = [...userFavorites.map((f) => f.id), ...selectedRowKeys];
        //    bulkEditFavorites(allFavorites);
        alert('TODO - feature not implemented yet');
      }
    },
    {
      label: 'Remove from favorites',
      icon: <Xmark />,
      value: 'remove-from-favorites',
      onClick: async () => {
        const allFavorites: string[] = userFavorites
          .map((f) => f.id)
          .filter((id) => !selectedRowKeys.includes(id));
        bulkEditFavorites(allFavorites);
      }
    }
  ];

  return (
    <Dropdown items={dropdownOptions}>
      <Button prefix={<Dots />} />
    </Dropdown>
  );
};
