'use client';

import React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useListDatasources } from '@/api/buster_rest/datasource';

export const useDataSourceList = () => {
  const {
    data: dataSourcesList,
    isFetched: isFetchedDatasourcesList,
    refetch: refetchDatasourcesList
  } = useListDatasources();

  return {
    dataSourcesList,
    isFetchedDatasourcesList,
    refetchDatasourcesList
  };
};

const DataSourceListContext = createContext<ReturnType<typeof useDataSourceList>>(
  {} as ReturnType<typeof useDataSourceList>
);

export const DataSourceListProvider = ({ children }: { children: React.ReactNode }) => {
  const { dataSourcesList, isFetchedDatasourcesList, refetchDatasourcesList } = useDataSourceList();

  return (
    <DataSourceListContext.Provider
      value={{ dataSourcesList, isFetchedDatasourcesList, refetchDatasourcesList }}>
      {children}
    </DataSourceListContext.Provider>
  );
};

export const useDataSourceListContextSelector = <T,>(
  selector: (state: ReturnType<typeof useDataSourceList>) => T
) => useContextSelector(DataSourceListContext, selector);
