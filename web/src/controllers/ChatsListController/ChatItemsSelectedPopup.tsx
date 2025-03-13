'use client';

import React, { useState } from 'react';
import { Dots, Star, Trash, Xmark } from '@/components/ui/icons';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/buttons';
import { useMemoizedFn } from '@/hooks';
import { SaveToCollectionsDropdown } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import {
  useDeleteMetric,
  useRemoveMetricFromCollection,
  useSaveMetricToCollection
} from '@/api/buster_rest/metrics';
import {
  useAddUserFavorite,
  useDeleteUserFavorite,
  useGetUserFavorites
} from '@/api/buster_rest/users';
import { ShareAssetType } from '@/api/asset_interfaces/share';

export const ChatSelectedOptionPopup: React.FC<{
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
        <DashboardButton
          key="dashboard"
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
  const { mutateAsync: saveMetricToCollection } = useSaveMetricToCollection();
  const { mutateAsync: removeMetricFromCollection } = useRemoveMetricFromCollection();

  const [selectedCollections, setSelectedCollections] = useState<
    Parameters<typeof SaveToCollectionsDropdown>[0]['selectedCollections']
  >([]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    setSelectedCollections(collectionIds);
    console.warn('TODO: save to collection', collectionIds);
    const allSaves: Promise<void>[] = selectedRowKeys.map((metricId) => {
      return saveMetricToCollection({
        metricId,
        collectionIds
      });
    });
    await Promise.all(allSaves);
    openInfoMessage('Metrics saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    setSelectedCollections((prev) => prev.filter((id) => id !== collectionId));
    const allSelectedButLast = selectedRowKeys.slice(0, -1);
    const lastMetricId = selectedRowKeys[selectedRowKeys.length - 1];
    const allRemoves: Promise<void>[] = allSelectedButLast.map((metricId) => {
      return removeMetricFromCollection({ metricId, collectionId });
    });
    await removeMetricFromCollection({
      metricId: lastMetricId,
      collectionId
    });
    await Promise.all(allRemoves);
    openInfoMessage('Metrics removed from collections');
  });

  return (
    <SaveToCollectionsDropdown
      onSaveToCollection={onSaveToCollection}
      onRemoveFromCollection={onRemoveFromCollection}
      selectedCollections={selectedCollections}>
      <Button prefix={<ASSET_ICONS.collections />}>Collections</Button>
    </SaveToCollectionsDropdown>
  );
};

const DashboardButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  return (
    <Dropdown items={[{ label: 'Dashboard', value: 'dashboard' }]}>
      <Button prefix={<ASSET_ICONS.dashboards />}>Dashboard</Button>
    </Dropdown>
  );
};

const DeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { mutateAsync: deleteMetric } = useDeleteMetric();

  const onDeleteClick = async () => {
    await deleteMetric({ ids: selectedRowKeys });
    onSelectChange([]);
  };

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
  const { mutateAsync: removeUserFavorite, isPending: removingFromFavorites } =
    useDeleteUserFavorite();
  const { mutateAsync: addUserFavorite, isPending: addingToFavorites } = useAddUserFavorite();
  const { data: userFavorites } = useGetUserFavorites();

  const dropdownOptions: DropdownItems = [
    {
      label: 'Add to favorites',
      icon: <Star />,
      value: 'add-to-favorites',
      loading: addingToFavorites,
      onClick: async () => {
        await Promise.all(
          selectedRowKeys.map((id) => {
            const name = userFavorites?.find((f) => f.id === id)?.name || '';
            return addUserFavorite({
              id,
              asset_type: ShareAssetType.METRIC,
              name
            });
          })
        );
      }
    },
    {
      label: 'Remove from favorites',
      icon: <Xmark />,
      loading: removingFromFavorites,
      value: 'remove-from-favorites',
      onClick: async () => {
        await Promise.all(selectedRowKeys.map((id) => removeUserFavorite(id)));
      }
    }
  ];

  return (
    <Dropdown items={dropdownOptions}>
      <Button prefix={<Dots />} />
    </Dropdown>
  );
};
