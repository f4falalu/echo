import type React from 'react';
import { useState } from 'react';
import { useGetCollection } from '@/api/buster_rest/collections';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { CollectionIndividualContent } from './CollectionIndividualContent';
import { CollectionsIndividualHeader } from './CollectionIndividualHeader';

export const CollectionIndividualController: React.FC<{
  collectionId: string;
}> = ({ collectionId }) => {
  const [openAddTypeModal, setOpenAddTypeModal] = useState(false);
  const { data: collection, isFetched: isCollectionFetched } = useGetCollection(collectionId);

  return (
    <AppPageLayout
      headerSizeVariant="list"
      header={
        <CollectionsIndividualHeader
          setOpenAddTypeModal={setOpenAddTypeModal}
          collection={collection}
          isFetched={isCollectionFetched}
        />
      }
    >
      <CollectionIndividualContent
        collection={collection}
        openAddTypeModal={openAddTypeModal}
        setOpenAddTypeModal={setOpenAddTypeModal}
      />
    </AppPageLayout>
  );
};
