import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listDatasources,
  getDatasource,
  deleteDatasource,
  createDatasource,
  updateDatasource
} from './requests';
import { queryKeys } from '@/api/query_keys';

export const useListDatasources = () => {
  return useQuery({
    ...queryKeys.datasourceGetList,
    queryFn: listDatasources
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
  return useMutation({
    mutationFn: deleteDatasource,
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
