import React from 'react';
import { Input } from 'antd';
import { useDebounceSearch } from '@/hooks';
import { InfiniteListContainer } from '@/components/list';

export const UserDatasetSearch = React.memo(() => {
  const { filteredItems, searchText, handleSearchChange, isPending } = useDebounceSearch({
    items: [],
    searchPredicate: (item, searchText) => true,
    debounceTime: 500
  });

  return (
    <div className="flex flex-col space-y-3">
      <Input className="w-full max-w-[280px]" placeholder="Search datasets..." />

      <InfiniteListContainer>
        <div>TEST</div>
      </InfiniteListContainer>
    </div>
  );
});

UserDatasetSearch.displayName = 'UserDatasetSearch';
