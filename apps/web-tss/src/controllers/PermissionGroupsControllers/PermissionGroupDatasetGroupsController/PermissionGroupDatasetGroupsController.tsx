import type React from 'react';
import { useMemo, useState } from 'react';
import { useGetPermissionGroupDatasetGroups } from '@/api/buster_rest/permission_groups';
import {
  NewDatasetGroupModal,
  PermissionSearchAndListWrapper,
} from '@/components/features/permissions';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { PermissionGroupDatasetGroupsListContainer } from './PermissionGroupDatasetsListContainer';

export const PermissionGroupDatasetGroupsController: React.FC<{
  permissionGroupId: string;
}> = ({ permissionGroupId }) => {
  const { data } = useGetPermissionGroupDatasetGroups(permissionGroupId);
  const [isNewDatasetGroupModalOpen, setIsNewDatasetGroupModalOpen] = useState(false);

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: data || [],
    searchPredicate: (item, searchText) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()),
  });

  const onCloseNewDatasetGroupModal = useMemoizedFn(() => {
    setIsNewDatasetGroupModalOpen(false);
  });

  const onOpenNewDatasetGroupModal = useMemoizedFn(() => {
    setIsNewDatasetGroupModalOpen(true);
  });

  const NewDatasetGroupButton: React.ReactNode = useMemo(() => {
    return (
      <Button prefix={<Plus />} onClick={onOpenNewDatasetGroupModal}>
        New dataset group
      </Button>
    );
  }, []);

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by permission group name..."
        searchChildren={NewDatasetGroupButton}
      >
        <PermissionGroupDatasetGroupsListContainer
          filteredDatasetGroups={filteredItems}
          permissionGroupId={permissionGroupId}
        />
      </PermissionSearchAndListWrapper>

      <NewDatasetGroupModal
        isOpen={isNewDatasetGroupModalOpen}
        onClose={onCloseNewDatasetGroupModal}
        datasetId={null}
      />
    </>
  );
};
