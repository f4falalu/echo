'use client';

import React, { useState } from 'react';
import { CollectionsListContent } from './CollectionsListContent';
import { CollectionListHeader } from './CollectionListHeader';

export const CollectionListController: React.FC = () => {
  const [openNewCollectionModal, setOpenNewCollectionModal] = useState(false);

  return (
    <>
      <CollectionListHeader setOpenNewCollectionModal={setOpenNewCollectionModal} />
      <CollectionsListContent
        openNewCollectionModal={openNewCollectionModal}
        setOpenNewCollectionModal={setOpenNewCollectionModal}
      />
    </>
  );
};
