import type { OrganizationUser } from '@buster/server-shared/organization';
import React from 'react';
import { PermissionSearchAndListWrapper } from '@/components/features/permissions/PermissionSearchAndListWrapper';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { UserDatasetListContainer } from './UserDatasetListContainer';

export const UserDatasetSearch = React.memo(({ user }: { user: OrganizationUser }) => {
  const { datasets } = user;
  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: datasets,
    searchPredicate: (item, searchText) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()),
  });

  return (
    <PermissionSearchAndListWrapper
      searchText={searchText}
      handleSearchChange={handleSearchChange}
      searchPlaceholder="Search by dataset name"
    >
      <UserDatasetListContainer filteredDatasets={filteredItems} />
    </PermissionSearchAndListWrapper>
  );
});

UserDatasetSearch.displayName = 'UserDatasetSearch';
