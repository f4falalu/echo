import { useMemoizedFn } from 'ahooks';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
import { useQueryClient } from '@tanstack/react-query';

export const useDatasourceUpdate = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: onUpdateDataSource } = useSocketQueryMutation({
    emitEvent: '/data_sources/update',
    responseEvent: '/data_sources/get:getDataSource',
    callback: (newData, currentData, variables) => {
      const options = queryKeys['/data_sources/get:getDataSource'](newData.id);
      queryClient.setQueryData(options.queryKey, newData);
      return currentData;
    }
  });

  return {
    onUpdateDataSource
  };
};
