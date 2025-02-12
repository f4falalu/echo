import React, { useState } from 'react';
import { useSocketQueryEmitOn } from '@/hooks';
import type { CollectionsListEmit } from '@/api/buster_socket/collections';
import {
  ContextSelector,
  useContextSelector,
  createContext
} from '@fluentui/react-context-selector';

type CollectionListFilters = Omit<CollectionsListEmit['payload'], 'page' | 'page_size'>;

export const useCollectionLists = () => {
  const [collectionListFilters, setCollectionListFilters] = useState<CollectionListFilters>({});

  const {
    data: collectionList,
    isFetched: isCollectionListFetched,
    refetch: refetchCollectionList
  } = useSocketQueryEmitOn(
    { route: '/collections/list', payload: { page: 0, page_size: 1000, ...collectionListFilters } },
    { route: '/collections/list:listCollections' }
  );

  return {
    collectionList,
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
  selector: ContextSelector<ReturnType<typeof useCollectionLists>, T>
) => useContextSelector(BusterCollectionLists, selector);
