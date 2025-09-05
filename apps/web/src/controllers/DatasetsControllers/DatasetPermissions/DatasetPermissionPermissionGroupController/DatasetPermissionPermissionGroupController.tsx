import React, { useState } from 'react';
import { useDatasetListPermissionGroups } from '@/api/buster_rest/datasets';
import {
  NewPermissionGroupModal,
  PermissionSearchAndListWrapper,
} from '@/components/features/permissions';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { DatasetPermissionPermissionGroupContentController } from './DatasetPermissionPermissionGroupContentController';

export const DatasetPermissionPermissionGroupController: React.FC<{
  datasetId: string;
}> = React.memo(({ datasetId }) => {
  const { data: permissionGroups, isFetched: isPermissionGroupsFetched } =
    useDatasetListPermissionGroups(datasetId);
  const [isNewPermissionGroupModalOpen, setIsNewPermissionGroupModalOpen] = useState(false);

  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: permissionGroups || [],
    searchPredicate: (item, searchText) => item.name.toLowerCase().includes(searchText),
  });

  const onCloseNewPermissionGroupModal = useMemoizedFn(() => {
    setIsNewPermissionGroupModalOpen(false);
  });

  const onOpenNewPermissionGroupModal = useMemoizedFn(() => {
    setIsNewPermissionGroupModalOpen(true);
  });

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by permission group"
        searchChildren={React.useMemo(
          () => (
            <Button className="min-w-fit" prefix={<Plus />} onClick={onOpenNewPermissionGroupModal}>
              New permission group
            </Button>
          ),
          [onOpenNewPermissionGroupModal]
        )}
      >
        {isPermissionGroupsFetched && (
          <DatasetPermissionPermissionGroupContentController
            filteredPermissionGroups={filteredItems}
            datasetId={datasetId}
          />
        )}
      </PermissionSearchAndListWrapper>

      <NewPermissionGroupModal
        isOpen={isNewPermissionGroupModalOpen}
        onClose={onCloseNewPermissionGroupModal}
        datasetId={datasetId}
      />
    </>
  );
});

DatasetPermissionPermissionGroupController.displayName =
  'DatasetPermissionPermissionGroupController';
