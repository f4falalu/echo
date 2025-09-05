import type React from 'react';
import { useMemo } from 'react';
import { useGetDatasetGroupUsers } from '@/api/buster_rest/dataset_groups';
import { PermissionSearchAndListWrapper } from '@/components/features/permissions';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useInviteModalStore } from '@/context/GlobalStore/useInviteModalStore';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { DatasetGroupUsersListContainer } from './DatasetGroupUsersListContainer';

export const DatasetGroupUsersController: React.FC<{
  datasetGroupId: string;
}> = ({ datasetGroupId }) => {
  const { data } = useGetDatasetGroupUsers(datasetGroupId);
  const { toggleInviteModal } = useInviteModalStore();

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: data || [],
    searchPredicate: (item, searchText) =>
      item.email.includes(searchText) || item.name.includes(searchText),
  });

  const NewUserButton: React.ReactNode = useMemo(() => {
    return (
      <Button prefix={<Plus />} onClick={() => toggleInviteModal(true)}>
        Invite user
      </Button>
    );
  }, []);

  return (
    <PermissionSearchAndListWrapper
      searchText={searchText}
      handleSearchChange={handleSearchChange}
      searchPlaceholder="Search by user name or email..."
      searchChildren={NewUserButton}
    >
      <DatasetGroupUsersListContainer
        filteredUsers={filteredItems}
        datasetGroupId={datasetGroupId}
      />
    </PermissionSearchAndListWrapper>
  );
};
