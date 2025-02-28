'use client';

import React from 'react';
import { AppContent } from '@/components/ui/layouts/AppContent';
import { DatasetsIndividualHeader } from './DatasetsIndividualHeader';
import { DatasetPageProvider } from './DatasetPageContext';

export const DatasetPageLayout: React.FC<{ children: React.ReactNode; datasetId: string }> = ({
  children,
  datasetId
}) => {
  return (
    <DatasetPageProvider datasetId={datasetId}>
      <DatasetsIndividualHeader />
      <AppContent>{children}</AppContent>
    </DatasetPageProvider>
  );
};
