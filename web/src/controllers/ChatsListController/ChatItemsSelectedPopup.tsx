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
  useDeleteChat,
  useSaveChatToCollections,
  useRemoveChatFromCollections
} from '@/api/buster_rest/chats';
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
  const { mutateAsync: saveChatToCollection } = useSaveChatToCollections();
  const { mutateAsync: removeChatFromCollection } = useRemoveChatFromCollections();

  const [selectedCollections, setSelectedCollections] = useState<
    Parameters<typeof SaveToCollectionsDropdown>[0]['selectedCollections']
  >([]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    setSelectedCollections(collectionIds);
    await saveChatToCollection({
      chatIds: selectedRowKeys,
      collectionIds
    });
    openInfoMessage('Chats saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    setSelectedCollections((prev) => prev.filter((id) => id !== collectionId));
    await removeChatFromCollection({
      chatIds: selectedRowKeys,
      collectionIds: [collectionId]
    });
    openInfoMessage('Chats removed from collections');
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

const DeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = React.memo(({ selectedRowKeys, onSelectChange }) => {
  const { mutateAsync: deleteChat } = useDeleteChat();

  const onDeleteClick = async () => {
    await deleteChat({ data: selectedRowKeys });
    onSelectChange([]);
  };

  return (
    <Button prefix={<Trash />} onClick={onDeleteClick}>
      Delete
    </Button>
  );
});

DeleteButton.displayName = 'DeleteButton';

const ThreeDotButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = React.memo(({ selectedRowKeys, onSelectChange }) => {
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
              asset_type: ShareAssetType.CHAT,
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
});

ThreeDotButton.displayName = 'ThreeDotButton';
