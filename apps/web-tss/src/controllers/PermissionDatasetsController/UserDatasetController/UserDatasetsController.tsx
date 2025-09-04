import React, { lazy, useMemo, useState } from 'react';
import { useGetUserDatasets } from '@/api/buster_rest/users/permissions';
import { PermissionSearchAndListWrapper } from '@/components/features/permissions';

const NewDatasetModal = lazy(() =>
  import('@/components/features/modals/NewDatasetModal').then((mod) => ({
    default: mod.NewDatasetModal,
  }))
);

import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { UserDatasetsListContainer } from './UserDatasetsListContainer';

export const UserDatasetsController: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: datasets } = useGetUserDatasets({ userId });
  const [isNewDatasetModalOpen, setIsNewDatasetModalOpen] = useState(false);
  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: datasets || [],
    searchPredicate: (item, searchText) => item.name.toLowerCase().includes(searchText),
  });

  const onCloseNewDatasetModal = useMemoizedFn(() => {
    setIsNewDatasetModalOpen(false);
  });

  const onOpenNewDatasetModal = useMemoizedFn(() => {
    setIsNewDatasetModalOpen(true);
  });

  const NewDatasetButton: React.ReactNode = useMemo(() => {
    return (
      <Button prefix={<Plus />} onClick={onOpenNewDatasetModal}>
        New dataset
      </Button>
    );
  }, []);

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by dataset group"
        searchChildren={NewDatasetButton}
      >
        <UserDatasetsListContainer filteredDatasets={filteredItems} userId={userId} />
      </PermissionSearchAndListWrapper>

      <NewDatasetModal open={isNewDatasetModalOpen} onClose={onCloseNewDatasetModal} />
    </>
  );
};
