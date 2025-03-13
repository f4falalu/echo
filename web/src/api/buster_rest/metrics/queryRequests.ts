import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { useMemoizedFn } from '@/hooks';
import {
  deleteMetrics,
  getMetric,
  getMetric_server,
  getMetricData,
  listMetrics,
  listMetrics_server,
  updateMetric
} from './requests';
import type { GetMetricParams, ListMetricsParams } from './interfaces';
import { upgradeMetricToIMetric } from '@/lib/chat';
import { queryKeys } from '@/api/query_keys';
import { useMemo } from 'react';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { resolveEmptyMetric } from '@/lib/metrics/resolve';
import { useGetUserFavorites } from '../users';
import { useBusterNotifications } from '@/context/BusterNotifications';
import type { IBusterMetric } from '@/api/asset_interfaces/metric';

export const useGetMetric = <TData = IBusterMetric>(
  id: string | undefined,
  select?: (data: IBusterMetric) => TData
) => {
  const getAssetPassword = useBusterAssetsContextSelector((x) => x.getAssetPassword);
  const setAssetPasswordError = useBusterAssetsContextSelector((x) => x.setAssetPasswordError);
  const { password } = getAssetPassword(id!);

  const queryClient = useQueryClient();
  const options = queryKeys.metricsGetMetric(id!);

  const queryFn = useMemoizedFn(async () => {
    const result = await getMetric({ id: id!, password });
    const oldMetric = queryClient.getQueryData(options.queryKey);
    return upgradeMetricToIMetric(result, oldMetric || null);
  });

  return useQuery({
    ...options,
    queryFn,
    select,
    enabled: !!id,
    throwOnError: (error, query) => {
      setAssetPasswordError(id!, error.message || 'An error occurred');
      return false;
    }
  });
};

export const prefetchGetMetric = async (params: GetMetricParams, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.metricsGetMetric(params.id),
    queryFn: async () => {
      const result = await getMetric_server(params);
      return upgradeMetricToIMetric(result, null);
    }
  });

  return queryClient;
};

export const useGetMetricsList = (params: Omit<ListMetricsParams, 'page_token' | 'page_size'>) => {
  const compiledParams: ListMetricsParams = useMemo(
    () => ({ ...params, page_token: 0, page_size: 3000 }),
    [params]
  );

  const queryFn = useMemoizedFn(() => {
    return listMetrics(compiledParams);
  });

  const res = useQuery({
    ...queryKeys.metricsGetList(compiledParams),
    queryFn
  });

  return {
    ...res,
    data: res.data || []
  };
};

export const prefetchGetMetricsList = async (
  params: ListMetricsParams,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...queryKeys.metricsGetList(params),
    queryFn: () => listMetrics_server(params)
  });

  return queryClient;
};

export const useGetMetricData = (params: { id: string }) => {
  const queryFn = useMemoizedFn(() => {
    return getMetricData(params);
  });
  return useQuery({
    ...queryKeys.metricsGetData(params.id),
    queryFn,
    enabled: !!params.id
  });
};

export const prefetchGetMetricDataClient = async (
  params: { id: string },
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.metricsGetData(params.id),
    queryFn: () => getMetricData(params)
  });
};

export const useUpdateMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMetric,
    onSuccess: (data, variables, context) => {
      const hasDraftSessionId = data.draft_session_id;
      const metricId = data.id;
      const options = queryKeys.metricsGetMetric(metricId);
      const currentMetric = queryClient.getQueryData(options.queryKey);
      if (hasDraftSessionId && !currentMetric?.draft_session_id && currentMetric) {
        queryClient.setQueryData(options.queryKey, {
          ...currentMetric,
          draft_session_id: data.draft_session_id
        });
      }
    }
  });
};

export const useDeleteMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMetrics,
    onMutate: async (variables) => {
      const metricIds = variables.ids;
      const options = queryKeys.metricsGetList();
      queryClient.setQueryData(options.queryKey, (oldData) => {
        return oldData?.filter((metric) => !metricIds.includes(metric.id));
      });
      for (const metricId of metricIds) {
        queryClient.removeQueries({
          queryKey: queryKeys.metricsGetMetric(metricId).queryKey,
          exact: true
        });
      }
    }
  });
};

export const useMetricIndividual = ({ metricId }: { metricId: string }) => {
  const {
    data: metric,
    isFetched: isMetricFetched,
    error: metricError,
    refetch: refetchMetric
  } = useGetMetric(metricId);

  const {
    data: metricData,
    isFetched: isFetchedMetricData,
    refetch: refetchMetricData,
    dataUpdatedAt: metricDataUpdatedAt,
    error: metricDataError
  } = useGetMetricData({ id: metricId });

  return useMemo(
    () => ({
      metric: resolveEmptyMetric(metric, metricId),
      isMetricFetched,
      refetchMetric,
      metricError,
      metricData,
      isFetchedMetricData,
      refetchMetricData,
      metricDataUpdatedAt,
      metricDataError
    }),
    [
      metric,
      metricId,
      isMetricFetched,
      refetchMetric,
      metricError,
      metricData,
      isFetchedMetricData,
      refetchMetricData,
      metricDataUpdatedAt,
      metricDataError
    ]
  );
};

export const useSaveMetricToCollection = () => {
  const { mutateAsync: updateMetricMutation } = useUpdateMetric();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();

  const saveMetricToCollection = useMemoizedFn(
    async ({ metricId, collectionIds }: { metricId: string; collectionIds: string[] }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        const searchId = f.collection_id || f.id;
        return collectionIds.includes(searchId);
      });

      await updateMetricMutation({
        id: metricId,
        add_to_collections: collectionIds
      });

      if (collectionIsInFavorites) {
        await refreshFavoritesList();
      }
    }
  );

  return useMutation({
    mutationFn: saveMetricToCollection,
    mutationKey: ['saveMetricToCollection']
  });
};

export const useRemoveMetricFromCollection = () => {
  const { mutateAsync: updateMetricMutation } = useUpdateMetric();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();
  const queryClient = useQueryClient();

  const removeMetricFromCollection = useMemoizedFn(
    async ({ metricId, collectionId }: { metricId: string; collectionId: string }) => {
      const currentMetric = queryClient.getQueryData(queryKeys.metricsGetMetric(metricId).queryKey);
      const collectionIsInFavorites =
        currentMetric &&
        userFavorites.some((f) => {
          const searchId = f.collection_id || f.id;
          return currentMetric.collections.some((c) => c.id === searchId);
        });

      await updateMetricMutation({
        id: metricId,
        remove_from_collections: [collectionId]
      });

      if (collectionIsInFavorites) {
        await refreshFavoritesList();
      }
    }
  );

  return useMutation({
    mutationFn: removeMetricFromCollection
  });
};

export const useSaveMetricToDashboard = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: updateMetricMutation } = useUpdateMetric();

  const saveMetricToDashboard = useMemoizedFn(
    async ({ metricId, dashboardIds }: { metricId: string; dashboardIds: string[] }) => {
      await updateMetricMutation({
        id: metricId,
        save_to_dashboard: dashboardIds
      });
    }
  );

  return useMutation({
    mutationFn: saveMetricToDashboard,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: variables.dashboardIds.map((id) => queryKeys.dashboardGetDashboard(id).queryKey)
      });
    }
  });
};

export const useRemoveMetricFromDashboard = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();
  const { mutateAsync: updateMetricMutation } = useUpdateMetric();

  const removeMetricFromDashboard = useMemoizedFn(
    async ({
      metricId,
      dashboardId,
      useConfirmModal = true
    }: {
      metricId: string;
      dashboardId: string;
      useConfirmModal?: boolean;
    }) => {
      const method = async () => {
        await updateMetricMutation({
          id: metricId,
          remove_from_dashboard: [dashboardId]
        });
      };

      if (!useConfirmModal) return await method();

      return await openConfirmModal({
        title: 'Remove from dashboard',
        content: 'Are you sure you want to remove this metric from this dashboard?',
        onOk: method
      });
    }
  );

  return useMutation({
    mutationFn: removeMetricFromDashboard
  });
};
