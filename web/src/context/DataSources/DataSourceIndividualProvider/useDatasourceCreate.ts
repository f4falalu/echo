import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { BusterRoutes } from '@/routes';
import { useMemoizedFn } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateDatasource, useDeleteDatasource } from '@/api/buster_rest/datasource';

export const useDatasourceCreate = () => {
  const { openConfirmModal } = useBusterNotifications();
  const queryClient = useQueryClient();
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);

  const { mutateAsync: onCreateDataSource } = useCreateDatasource();

  // const { mutateAsync: deleteDataSourceMutation } = useSocketQueryMutation({
  //   emitEvent: '/data_sources/delete',
  //   responseEvent: '/data_sources/delete:deleteDataSource',
  //   options: queryKeys.datasourceGetList,
  //   preCallback: (currentData, variables) => {
  //     return currentData?.filter((d) => d.id !== variables.id) || [];
  //   }
  // });

  const { mutateAsync: deleteDataSourceMutation } = useDeleteDatasource();

  //DATA SOURCES INDIVIDUAL

  const onDeleteDataSource = useMemoizedFn(async (dataSourceId: string, goToPage = true) => {
    await openConfirmModal({
      title: 'Delete Data Source',
      content: 'Are you sure you want to delete this data source?',
      onOk: async () => {
        await deleteDataSourceMutation(dataSourceId);
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
