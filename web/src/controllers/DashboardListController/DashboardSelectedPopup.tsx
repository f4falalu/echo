import React, { useState } from 'react';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/buttons';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { SaveToCollectionsDropdown } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { Dots, Star, Trash, Xmark } from '@/components/ui/icons';
import {
  useAddUserFavorite,
  useDeleteUserFavorite,
  useGetUserFavorites
} from '@/api/buster_rest/users';
import { ShareAssetType } from '@/api/asset_interfaces/share';
import {
  useAddDashboardToCollection,
  useDeleteDashboards,
  useRemoveDashboardFromCollection
} from '@/api/buster_rest/dashboards';

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
  const { mutateAsync: onAddDashboardToCollection } = useAddDashboardToCollection();
  const { mutateAsync: onRemoveDashboardFromCollection } = useRemoveDashboardFromCollection();

  const [selectedCollections, setSelectedCollections] = useState<
    Parameters<typeof SaveToCollectionsDropdown>[0]['selectedCollections']
  >([]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    await Promise.all(
      selectedRowKeys.map((dashboardId) => {
        return onAddDashboardToCollection({
          dashboardId,
          collectionId: collectionIds
        });
      })
    );
    setSelectedCollections([]);
    onSelectChange([]);
    openInfoMessage('Dashboards saved to collections');
  });

  const onRemoveFromCollectionPreflight = useMemoizedFn(async (collectionId: string) => {
    await Promise.all(
      selectedRowKeys.map((dashboardId) => {
        return onRemoveDashboardFromCollection({
          dashboardId,
          collectionId
        });
      })
    );
    setSelectedCollections([]);
    onSelectChange([]);
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
  const { mutateAsync: deleteDashboard, isPending: isDeletingDashboard } = useDeleteDashboards();
  const { openConfirmModal } = useBusterNotifications();

  const onDeleteClick = useMemoizedFn(async () => {
    openConfirmModal({
      title: 'Delete dashboard',
      content: 'Are you sure you want to delete these dashboards?',
      onOk: async () => {
        await deleteDashboard({ dashboardId: selectedRowKeys });
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
  const { mutateAsync: addUserFavorite } = useAddUserFavorite();
  const { mutateAsync: removeUserFavorite } = useDeleteUserFavorite();
  const { data: userFavorites } = useGetUserFavorites();

  const dropdownOptions: DropdownItems = [
    {
      label: 'Add to favorites',
      icon: <Star />,
      value: 'add-to-favorites',
      onClick: async () => {
        const allFavorites: Parameters<typeof addUserFavorite>[0] = selectedRowKeys.map((id) => ({
          id,
          asset_type: ShareAssetType.DASHBOARD,
          name: 'Dashboard'
        }));
        await addUserFavorite(allFavorites);
      }
    },
    {
      label: 'Remove from favorites',
      icon: <Xmark />,
      value: 'remove-from-favorites',
      onClick: async () => {
        const allFavorites: Parameters<typeof removeUserFavorite>[0] = userFavorites
          .map((f) => f.id)
          .filter((id) => !selectedRowKeys.includes(id))
          .map((id) => ({ id, asset_type: ShareAssetType.DASHBOARD }));
        await removeUserFavorite(allFavorites);
      }
    }
  ];

  return (
    <Dropdown items={dropdownOptions}>
      <Button prefix={<Dots />} />
    </Dropdown>
  );
};
