import type React from 'react';
import { lazy, useMemo, useState } from 'react';
import { useGetPermissionGroupDatasets } from '@/api/buster_rest/permission_groups';
import { PermissionSearchAndListWrapper } from '@/components/features/permissions';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { PermissionGroupDatasetsListContainer } from './PermissionGroupDatasetsListContainer';

const NewDatasetModal = lazy(() =>
  import('@/components/features/modals/NewDatasetModal').then((mod) => ({
    default: mod.NewDatasetModal,
  }))
);

export const PermissionGroupDatasetsController: React.FC<{
  permissionGroupId: string;
}> = ({ permissionGroupId }) => {
  const { data } = useGetPermissionGroupDatasets(permissionGroupId);
  const [isNewDatasetModalOpen, setIsNewDatasetModalOpen] = useState(false);

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: data || [],
    searchPredicate: (item, searchText) => item.name.includes(searchText),
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
        searchPlaceholder="Search by dataset name..."
        searchChildren={NewDatasetButton}
      >
        <PermissionGroupDatasetsListContainer
          filteredDatasets={filteredItems}
          permissionGroupId={permissionGroupId}
        />
      </PermissionSearchAndListWrapper>

      <NewDatasetModal open={isNewDatasetModalOpen} onClose={onCloseNewDatasetModal} />
    </>
  );
};
