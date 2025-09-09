import { useGetOrganizationUsers } from '@/api/buster_rest/organizations';
import { useGetUserOrganization } from '@/api/buster_rest/users/useGetUserInfo';
import { InvitePeopleModal } from '@/components/features/modals/InvitePeopleModal';
import { PermissionSearch } from '@/components/features/permissions';
import { SettingsPageHeader } from '@/components/features/settings';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useInviteModalStore } from '@/context/GlobalStore/useInviteModalStore';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { ListUsersComponent } from './ListUsersComponent';

export function ListUsersController() {
  const userOrganization = useGetUserOrganization();
  const restrictNewUserInvitations = userOrganization?.restrictNewUserInvitations ?? true;
  const firstOrganizationId = userOrganization?.id || '';
  const { data: users, isFetched } = useGetOrganizationUsers(firstOrganizationId);
  const { openInviteModal, closeInviteModal, toggleInviteModal } = useInviteModalStore();

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: users || [],
    searchPredicate: (item, searchText) =>
      item.email?.includes(searchText) || item.name?.includes(searchText),
  });

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="px-[30px] pt-[46px]">
          <SettingsPageHeader
            title="User management"
            description="Manage your organization's users and their permissions"
            type="alternate"
          />
          <div className="flex items-center justify-between">
            <PermissionSearch
              placeholder="Search users name or email..."
              searchText={searchText}
              setSearchText={handleSearchChange}
            />

            {!restrictNewUserInvitations && (
              <Button prefix={<Plus />} onClick={() => toggleInviteModal(true)}>
                Invite people
              </Button>
            )}
          </div>
        </div>

        <ListUsersComponent users={filteredItems} isFetched={isFetched} />
      </div>

      <InvitePeopleModal open={openInviteModal} onClose={closeInviteModal} />
    </>
  );
}
