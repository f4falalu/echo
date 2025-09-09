import React from 'react';
import { useDatasetListPermissionUsers } from '@/api/buster_rest/datasets';
import { PermissionSearchAndListWrapper } from '@/components/features/permissions';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useInviteModalStore } from '@/context/GlobalStore/useInviteModalStore';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { PermissionListUsersContainer } from './PermissionListUsersContainer';

export const DatasetPermissionUsersController: React.FC<{
  datasetId: string;
}> = React.memo(({ datasetId }) => {
  const { toggleInviteModal } = useInviteModalStore();
  const { data: permissionUsers, isFetched: isPermissionUsersFetched } =
    useDatasetListPermissionUsers(datasetId);

  const { searchText, handleSearchChange, filteredItems } = useDebounceSearch({
    items: permissionUsers || [],
    searchPredicate: (item, searchText) => {
      const lowerCaseSearchText = searchText.toLowerCase();
      return (
        item.name.toLocaleLowerCase().includes(lowerCaseSearchText) ||
        item.email.toLocaleLowerCase().includes(lowerCaseSearchText)
      );
    },
  });

  const openInviteUserModal = useMemoizedFn(() => {
    toggleInviteModal(true);
  });

  return (
    <PermissionSearchAndListWrapper
      searchText={searchText}
      handleSearchChange={handleSearchChange}
      searchPlaceholder="Search by user"
      searchChildren={React.useMemo(
        () => (
          <Button prefix={<Plus />} onClick={openInviteUserModal}>
            Invite user
          </Button>
        ),
        [openInviteUserModal]
      )}
    >
      {isPermissionUsersFetched && (
        <PermissionListUsersContainer
          filteredPermissionUsers={filteredItems}
          datasetId={datasetId}
        />
      )}
    </PermissionSearchAndListWrapper>
  );
});

DatasetPermissionUsersController.displayName = 'DatasetPermissionUsersController';
