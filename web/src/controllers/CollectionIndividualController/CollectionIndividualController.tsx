'use client';

import React, { useState } from 'react';
import { CollectionsIndividualHeader } from './CollectionIndividualHeader';
import { CollectionIndividualContent } from './CollectionIndividualContent';
import { useCollectionIndividual } from '@/context/Collections';
import { AppPageLayout } from '@/components/ui/layouts';

export const CollectionIndividualController: React.FC<{
  collectionId: string;
}> = ({ collectionId }) => {
  const [openAddTypeModal, setOpenAddTypeModal] = useState(false);

  const { collection, isCollectionFetched } = useCollectionIndividual({ collectionId });

  return (
    <AppPageLayout
      header={
        <CollectionsIndividualHeader
          openAddTypeModal={openAddTypeModal}
          setOpenAddTypeModal={setOpenAddTypeModal}
          collection={collection}
          isFetched={isCollectionFetched}
        />
      }>
      <CollectionIndividualContent
        collection={collection}
        openAddTypeModal={openAddTypeModal}
        setOpenAddTypeModal={setOpenAddTypeModal}
      />
    </AppPageLayout>
  );
};
