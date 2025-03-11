import { useGetDatasource } from '@/api/buster_rest/datasource';

export const useDataSourceIndividual = (id: string) => {
  const { data: dataSource, isFetched: isFetchedDataSource } = useGetDatasource(id);

  return {
    dataSource,
    isFetchedDataSource
  };
};
