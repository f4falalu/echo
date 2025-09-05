import type React from 'react';
import { useMemo } from 'react';
import { useGetPermissionGroupUsers } from '@/api/buster_rest/permission_groups';
import { PermissionSearchAndListWrapper } from '@/components/features/permissions';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useInviteModalStore } from '@/context/GlobalStore/useInviteModalStore';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { PermissionGroupUsersListContainer } from './PermissionGroupUsersListContainer';

export const PermissionGroupUsersController: React.FC<{
  permissionGroupId: string;
}> = ({ permissionGroupId }) => {
  const { data } = useGetPermissionGroupUsers(permissionGroupId);
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
      <PermissionGroupUsersListContainer
        filteredUsers={filteredItems}
        permissionGroupId={permissionGroupId}
      />
    </PermissionSearchAndListWrapper>
  );
};
