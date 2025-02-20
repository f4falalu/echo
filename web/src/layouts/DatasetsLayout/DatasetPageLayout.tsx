'use client';

import React from 'react';
import { AppContent } from '@/components/ui/layout/AppContent';
import { DatasetsIndividualHeader } from './DatasetsIndividualHeader';
import { DatasetPageProvider } from './DatasetPageContext';

export const DatasetPageLayout: React.FC<{ children: React.ReactNode; datasetId: string }> = ({
  children,
  datasetId
}) => {
  return (
    <DatasetPageProvider datasetId={datasetId}>
      <LayoutContent>{children}</LayoutContent>
    </DatasetPageProvider>
  );
};

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <DatasetsIndividualHeader />
      <AppContent>{children}</AppContent>
    </>
  );
};
