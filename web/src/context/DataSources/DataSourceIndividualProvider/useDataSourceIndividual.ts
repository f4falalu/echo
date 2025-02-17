import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';

export const useDataSourceIndividual = (id: string) => {
  const { data: dataSource, isFetched: isFetchedDataSource } = useSocketQueryEmitOn(
    {
      route: '/data_sources/get',
      payload: { id }
    },
    '/data_sources/get:getDataSource',
    queryKeys['/data_sources/get:getDataSource'](id)
  );

  return {
    dataSource,
    isFetchedDataSource
  };
};
