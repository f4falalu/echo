import React from 'react';
import { useDebounceSearch } from '@/hooks';
import { OrganizationUser } from '@/api';
import { PermissionSearchAndListWrapper } from '@/app/app/_components/PermissionComponents';
import { UserDatasetListContainer } from '../dataset-groups/UserDatasetListContainer';

export const UserDatasetSearch = React.memo(({ user }: { user: OrganizationUser }) => {
  const { filteredItems, searchText, handleSearchChange, isPending } = useDebounceSearch({
    items: [],
    searchPredicate: (item, searchText) => true
  });

  return (
    <PermissionSearchAndListWrapper
      searchText={searchText}
      handleSearchChange={handleSearchChange}
      searchPlaceholder="Search by dataset name">
      <UserDatasetListContainer filteredDatasets={filteredItems} />
    </PermissionSearchAndListWrapper>
  );
});

UserDatasetSearch.displayName = 'UserDatasetSearch';
