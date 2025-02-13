'use client';

import React, { useState } from 'react';
import { CollectionsIndividualHeader } from './CollectionIndividualHeader';
import { CollectionIndividualContent } from './CollectionIndividualContent';

export const CollectionIndividualController: React.FC<{
  collectionId: string;
}> = ({ collectionId }) => {
  const [openAddTypeModal, setOpenAddTypeModal] = useState(false);

  return (
    <>
      <CollectionsIndividualHeader
        collectionId={collectionId}
        openAddTypeModal={openAddTypeModal}
        setOpenAddTypeModal={setOpenAddTypeModal}
      />
      <CollectionIndividualContent
        collectionId={collectionId}
        openAddTypeModal={openAddTypeModal}
        setOpenAddTypeModal={setOpenAddTypeModal}
      />
    </>
  );
};
