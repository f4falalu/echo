'use client';

import React from 'react';
import { BusterCollectionListsProvider } from './CollectionListProvider';
import { BusterCollectionIndividualProvider } from './CollectionIndividualProvider';

export const BusterCollectionsProvider = React.memo<{
  children: React.ReactNode;
}>(({ children }) => {
  return (
    <BusterCollectionListsProvider>
      <BusterCollectionIndividualProvider>{children}</BusterCollectionIndividualProvider>
    </BusterCollectionListsProvider>
  );
});
BusterCollectionsProvider.displayName = 'BusterCollectionsProvider';
