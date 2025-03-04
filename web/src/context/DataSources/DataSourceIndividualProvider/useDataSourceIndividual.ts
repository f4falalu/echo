import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';

export const useDataSourceIndividual = (id: string) => {
  const { data: dataSource, isFetched: isFetchedDataSource } = useSocketQueryEmitOn({
    emitEvent: {
      route: '/data_sources/get',
      payload: { id }
    },
    responseEvent: '/data_sources/get:getDataSource',
    options: queryKeys.datasourceGet(id)
  });

  return {
    dataSource,
    isFetchedDataSource
  };
};
