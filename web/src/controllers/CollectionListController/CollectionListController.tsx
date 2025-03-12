'use client';

import React, { useState } from 'react';
import { CollectionsListContent } from './CollectionsListContent';
import { CollectionListHeader } from './CollectionListHeader';
import { AppPageLayout } from '@/components/ui/layouts';
import { GetCollectionListParams } from '@/api/request_interfaces/collections';
import { useGetCollectionsList } from '@/api/buster_rest/collections';

export const CollectionListController: React.FC = () => {
  const [openNewCollectionModal, setOpenNewCollectionModal] = useState(false);
  const [collectionListFilters, setCollectionListFilters] = useState<
    Omit<GetCollectionListParams, 'page' | 'page_size'>
  >({});

  const { data: collectionsList, isFetched: isCollectionListFetched } =
    useGetCollectionsList(collectionListFilters);

  return (
    <AppPageLayout
      header={
        <CollectionListHeader
          setOpenNewCollectionModal={setOpenNewCollectionModal}
          isCollectionListFetched={isCollectionListFetched}
          collectionsList={collectionsList}
          collectionListFilters={collectionListFilters}
          setCollectionListFilters={setCollectionListFilters}
        />
      }>
      <CollectionsListContent
        openNewCollectionModal={openNewCollectionModal}
        isCollectionListFetched={isCollectionListFetched}
        collectionsList={collectionsList}
        setOpenNewCollectionModal={setOpenNewCollectionModal}
      />
    </AppPageLayout>
  );
};
