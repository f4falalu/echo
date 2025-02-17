import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { BusterRoutes } from '@/routes';
import { useMemoizedFn } from 'ahooks';
import { useQueryClient } from '@tanstack/react-query';

export const useDatasourceCreate = () => {
  const { openConfirmModal } = useBusterNotifications();
  const queryClient = useQueryClient();
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);

  const { mutateAsync: onCreateDataSource } = useSocketQueryMutation(
    '/data_sources/post',
    '/data_sources/get:getDataSource',
    null,
    null,
    (newData, currentData, variables) => {
      const options = queryKeys['/data_sources/get:getDataSource'](newData.id);
      queryClient.setQueryData(options.queryKey, newData);
      return currentData;
    }
  );

  const { mutateAsync: deleteDataSourceMutation } = useSocketQueryMutation(
    '/data_sources/delete',
    '/data_sources/delete:deleteDataSource',
    queryKeys['/data_sources/list:getDatasourcesList'],
    (currentData, variables) => {
      return currentData?.filter((d) => d.id !== variables.id) || [];
    }
  );

  //DATA SOURCES INDIVIDUAL

  const onDeleteDataSource = useMemoizedFn(async (dataSourceId: string, goToPage = true) => {
    await openConfirmModal({
      title: 'Delete Data Source',
      content: 'Are you sure you want to delete this data source?',
      onOk: async () => {
        await deleteDataSourceMutation({ id: dataSourceId });
      }
    }).then(() => {
      if (goToPage) {
        onChangePage({
          route: BusterRoutes.SETTINGS_DATASOURCES
        });
      }
    });
  });

  return {
    onCreateDataSource,
    onDeleteDataSource
  };
};
