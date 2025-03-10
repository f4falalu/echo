import React, { useMemo, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useGetCollectionsList } from '@/api/buster_rest/collections';
import type { GetCollectionListParams } from '@/api/request_interfaces/collections';

type CollectionListFilters = Omit<GetCollectionListParams, 'page' | 'page_size'>;

export const useCollectionLists = () => {
  const [collectionListFilters, setCollectionListFilters] = useState<CollectionListFilters>({});
  const currentSegment = useAppLayoutContextSelector((x) => x.currentSegment);

  const payload = useMemo(() => {
    return { page: 0, page_size: 1000, ...collectionListFilters };
  }, [collectionListFilters]);

  const {
    data: collectionsList,
    isFetched: isCollectionListFetched,
    refetch: refetchCollectionList
  } = useGetCollectionsList(payload);

  return {
    collectionsList,
    isCollectionListFetched,
    collectionListFilters,
    setCollectionListFilters,
    refetchCollectionList
  };
};

const BusterCollectionLists = createContext<ReturnType<typeof useCollectionLists>>(
  {} as ReturnType<typeof useCollectionLists>
);

export const BusterCollectionListsProvider = React.memo<{
  children: React.ReactNode;
}>(({ children }) => {
  const value = useCollectionLists();

  return <BusterCollectionLists.Provider value={value}>{children}</BusterCollectionLists.Provider>;
});
BusterCollectionListsProvider.displayName = 'BusterCollectionListsProvider';

export const useBusterCollectionListContextSelector = <T,>(
  selector: (state: ReturnType<typeof useCollectionLists>) => T
) => useContextSelector(BusterCollectionLists, selector);
