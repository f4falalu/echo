'use client';

import React from 'react';
import { AppContentPage } from '@/components/ui/layouts/AppContentPage';
import { DatasetsIndividualHeader } from './DatasetsIndividualHeader';
import { DatasetPageProvider } from './DatasetPageContext';

export const DatasetPageLayout: React.FC<{ children: React.ReactNode; datasetId: string }> = ({
  children,
  datasetId
}) => {
  return (
    <DatasetPageProvider datasetId={datasetId}>
      <DatasetsIndividualHeader />
      <AppContentPage>{children}</AppContentPage>
    </DatasetPageProvider>
  );
};
