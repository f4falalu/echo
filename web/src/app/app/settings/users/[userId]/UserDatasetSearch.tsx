import React from 'react';
import { useDebounceSearch } from '@/hooks';
import { OrganizationUser } from '@/api';
import { PermissionSearch } from '@/app/app/_components/PermissionComponents';
import { UserDatasetListContainer } from './UserDatasetListContainer';

export const UserDatasetSearch = React.memo(({ user }: { user: OrganizationUser }) => {
  const { filteredItems, searchText, handleSearchChange, isPending } = useDebounceSearch({
    items: [],
    searchPredicate: (item, searchText) => true
  });

  return (
    <div className="flex h-full flex-col space-y-3 pb-12">
      <PermissionSearch searchText={searchText} setSearchText={handleSearchChange} />
      <UserDatasetListContainer filteredDatasets={filteredItems} />
    </div>
  );
});

UserDatasetSearch.displayName = 'UserDatasetSearch';
