import React, { PropsWithChildren } from 'react';
import { DataSourceListProvider } from './useDataSourceList';
import { DataSourceIndividualProvider } from './DataSourceIndividualProvider';

export const DataSourceProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  return (
    <DataSourceListProvider>
      <DataSourceIndividualProvider>{children}</DataSourceIndividualProvider>
    </DataSourceListProvider>
  );
});

DataSourceProvider.displayName = 'DataSourceProvider';
