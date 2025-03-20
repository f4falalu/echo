import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listDatasources,
  getDatasource,
  deleteDatasource,
  createDatasource,
  updateDatasource
} from './requests';
import { queryKeys } from '@/api/query_keys';
import { useBusterNotifications } from '@/context/BusterNotifications';

export const useListDatasources = (enabled: boolean = true) => {
  return useQuery({
    ...queryKeys.datasourceGetList,
    queryFn: listDatasources,
    enabled
  });
};

export const useGetDatasource = (id: string | undefined) => {
  return useQuery({
    ...queryKeys.datasourceGet(id!),
    queryFn: () => getDatasource(id!),
    enabled: !!id
  });
};

export const useDeleteDatasource = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();

  const mutationFn = async (dataSourceId: string) => {
    await openConfirmModal({
      title: 'Delete Data Source',
      content: 'Are you sure you want to delete this data source?',
      onOk: async () => {
        await deleteDatasource(dataSourceId);
      }
    });
  };

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
    }
  });
};

export const useCreateDatasource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDatasource,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
    }
  });
};

export const useUpdateDatasource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDatasource,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
    }
  });
};
