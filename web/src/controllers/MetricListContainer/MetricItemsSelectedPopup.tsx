import React, { useState } from 'react';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { ShareAssetType, VerificationStatus } from '@/api/asset_interfaces';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemoizedFn } from '@/hooks';
import { SaveToCollectionsDropdown } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { Button } from '@/components/ui/buttons';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import { StatusBadgeButton } from '@/components/features/metrics/StatusBadgeIndicator';
import { Dots, Star, Trash, Xmark } from '@/components/ui/icons';
import { useDeleteMetric } from '@/api/buster_rest/metrics';
import {
  useAddUserFavorite,
  useDeleteUserFavorite,
  useGetUserFavorites
} from '@/api/buster_rest/users';

export const MetricSelectedOptionPopup: React.FC<{
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
        <StatusButton
          key="status"
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
  const saveMetricToCollection = useBusterMetricsIndividualContextSelector(
    (state) => state.saveMetricToCollection
  );
  const removeMetricFromCollection = useBusterMetricsIndividualContextSelector(
    (state) => state.removeMetricFromCollection
  );

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
      <Button prefix={<ASSET_ICONS.dashboards />} type="button">
        Dashboard
      </Button>
    </Dropdown>
  );
};

const StatusButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const onVerifiedMetric = useBusterMetricsIndividualContextSelector(
    (state) => state.onVerifiedMetric
  );
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);

  const onVerify = useMemoizedFn(async (d: { id: string; status: VerificationStatus }[]) => {
    //   await onVerifiedMetric(d);
    onSelectChange([]);
  });

  return (
    <StatusBadgeButton
      status={VerificationStatus.NOT_REQUESTED}
      id={selectedRowKeys}
      onVerify={onVerify}
      isAdmin={isAdmin}
    />
  );
};

const DeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { mutateAsync: deleteMetric } = useDeleteMetric();
  const { openConfirmModal } = useBusterNotifications();

  const onDeleteClick = async () => {
    openConfirmModal({
      title: 'Delete metric',
      content: 'Are you sure you want to delete these metrics?',
      onOk: async () => {
        await deleteMetric({ ids: selectedRowKeys });
        onSelectChange([]);
      }
    });
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
          asset_type: ShareAssetType.METRIC,
          name: 'Metric'
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
          .map((id) => ({ id, asset_type: ShareAssetType.METRIC }));
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
