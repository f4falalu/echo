import { useCreateReactMutation, useCreateReactQuery } from '@/api/createReactQuery';
import {
  createDataset,
  deployDataset,
  getDatasetDataSample,
  getDatasetMetadata,
  getDatasets,
  updateDataset,
  deleteDataset,
  getDatasets_server,
  getDatasetMetadata_server
} from './requests';
import { useMemoizedFn } from 'ahooks';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';
import { datasetQueryKeys } from '@/api/query_keys/datasets';

const options = datasetQueryKeys.datasetsListQueryOptions();
const baseDatasetQueryKey = options.queryKey;

export const useGetDatasets = (params?: Parameters<typeof getDatasets>[0]) => {
  const queryFn = useMemoizedFn(() => {
    return getDatasets(params);
  });

  const res = useCreateReactQuery({
    ...queryKeys.datasetsListQueryOptions(params),
    queryFn
  });

  return {
    ...res,
    data: res.data || []
  };
};

export const prefetchGetDatasets = async (
  params?: Parameters<typeof getDatasets>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...queryKeys.datasetsListQueryOptions(params),
    queryFn: () => getDatasets_server(params)
  });

  return queryClient;
};

export const useGetDatasetData = (datasetId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetDataSample(datasetId));
  return useCreateReactQuery({
    ...queryKeys.datasetData(datasetId),
    queryFn,
    enabled: !!datasetId,
    refetchOnMount: false
  });
};

export const useGetDatasetMetadata = (datasetId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetMetadata(datasetId));
  const res = useCreateReactQuery({
    ...queryKeys.datasetMetadata(datasetId),
    queryFn,
    enabled: !!datasetId
  });
  return res;
};

export const prefetchGetDatasetMetadata = async (
  datasetId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.datasetMetadata(datasetId),
    queryFn: () => getDatasetMetadata_server(datasetId)
  });
  return queryClient;
};

export const useCreateDataset = () => {
  const queryClient = useQueryClient();

  const onSuccess = useMemoizedFn(() => {
    queryClient.invalidateQueries({ queryKey: baseDatasetQueryKey, exact: true });
  });

  return useCreateReactMutation({
    mutationFn: createDataset,
    onSuccess
  });
};

export const useDeployDataset = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((params: { dataset_id: string; sql: string; yml: string }) =>
    deployDataset(params)
  );

  return useCreateReactMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: baseDatasetQueryKey, exact: true });
    }
  });
};

export const useUpdateDataset = () => {
  return useCreateReactMutation({
    mutationFn: updateDataset
  });
};

export const useDeleteDataset = () => {
  const queryClient = useQueryClient();
  const onSuccess = useMemoizedFn(() => {
    queryClient.invalidateQueries({ queryKey: baseDatasetQueryKey, exact: true });
  });
  return useCreateReactMutation({
    mutationFn: deleteDataset,
    onSuccess
  });
};
