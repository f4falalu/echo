'use client';

import React, { useState } from 'react';
import { CollectionsListContent } from './CollectionsListContent';
import { CollectionListHeader } from './CollectionListHeader';
import { AppPageLayout } from '@/components/ui/layouts';

export const CollectionListController: React.FC = () => {
  const [openNewCollectionModal, setOpenNewCollectionModal] = useState(false);

  return (
    <AppPageLayout
      header={<CollectionListHeader setOpenNewCollectionModal={setOpenNewCollectionModal} />}>
      <CollectionsListContent
        openNewCollectionModal={openNewCollectionModal}
        setOpenNewCollectionModal={setOpenNewCollectionModal}
      />
    </AppPageLayout>
  );
};
