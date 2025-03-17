import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { useMemoizedFn, useDebounceFn } from '@/hooks';
import {
  deleteMetrics,
  duplicateMetric,
  getMetric,
  getMetric_server,
  getMetricData,
  listMetrics,
  listMetrics_server,
  updateMetric
} from './requests';
import type { GetMetricParams, ListMetricsParams, UpdateMetricParams } from './interfaces';
import { upgradeMetricToIMetric } from '@/lib/chat';
import { queryKeys } from '@/api/query_keys';
import { useMemo, useTransition } from 'react';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { resolveEmptyMetric } from '@/lib/metrics/resolve';
import { useGetUserFavorites } from '../users';
import { useBusterNotifications } from '@/context/BusterNotifications';
import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { create } from 'mutative';
import { prepareMetricUpdateMetric } from '@/lib/metrics/saveToServerHelpers';

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

/**
 * This is a mutation that saves a metric to the server.
 * It will simply use the params passed in and not do any special logic.
 */
export const useSaveMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMetric,
    onSuccess: (data) => {
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

/**
 * This is a mutation that updates a metric.
 * It will create a new metric with the new values combined with the old values and save it to the server.
 * It will also strip out any values that are not changed from the DEFAULT_CHART_CONFIG.
 * It will also update the draft_session_id if it exists.
 */
export const useUpdateMetric = (params?: { wait?: number }) => {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { mutateAsync: saveMetric } = useSaveMetric();
  const waitTime = params?.wait || 0;

  const combineAndSaveMetric = useMemoizedFn(
    async (newMetricPartial: Partial<IBusterMetric> & { id: string }) => {
      const metricId = newMetricPartial.id;
      const options = queryKeys.metricsGetMetric(metricId);
      const prevMetric = queryClient.getQueryData(options.queryKey);
      const newMetric = create(prevMetric, (draft) => {
        Object.assign(draft || {}, newMetricPartial);
      });

      if (prevMetric && newMetric) {
        queryClient.setQueryData(options.queryKey, newMetric);
      }

      return { newMetric, prevMetric };
    }
  );

  const mutationFn = useMemoizedFn(
    async (newMetricPartial: Partial<IBusterMetric> & { id: string }) => {
      const { newMetric, prevMetric } = await combineAndSaveMetric(newMetricPartial);
      if (newMetric && prevMetric) {
        startTransition(() => {
          const changedValues = prepareMetricUpdateMetric(newMetric, prevMetric);
          if (changedValues) {
            saveMetric(changedValues);
          }
        });
      }
      return Promise.resolve(newMetric!);
    }
  );

  const mutationRes = useMutation({
    mutationFn: mutationFn
  });

  const { run: mutateDebounced } = useDebounceFn(mutationRes.mutateAsync, { wait: waitTime });

  return useMemo(
    () => ({
      ...mutationRes,
      mutateDebounced
    }),
    [mutationRes, mutateDebounced]
  );
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
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();
  const { mutateAsync: saveMetric } = useSaveMetric();

  const saveMetricToCollection = useMemoizedFn(
    async ({ metricId, collectionIds }: { metricId: string; collectionIds: string[] }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        const searchId = f.collection_id || f.id;
        return collectionIds.includes(searchId);
      });

      await saveMetric({
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
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();
  const { mutateAsync: saveMetric } = useSaveMetric();
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

      await saveMetric({
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
  const { mutateAsync: saveMetric } = useSaveMetric();

  const saveMetricToDashboard = useMemoizedFn(
    async ({ metricId, dashboardIds }: { metricId: string; dashboardIds: string[] }) => {
      await saveMetric({
        id: metricId,
        save_to_dashboard: dashboardIds
      });
    }
  );

  return useMutation({
    mutationFn: saveMetricToDashboard,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: variables.dashboardIds.map((id) => queryKeys.dashboardGetDashboard(id).queryKey)
      });
    }
  });
};

export const useRemoveMetricFromDashboard = () => {
  const { openConfirmModal } = useBusterNotifications();
  const { mutateAsync: saveMetric } = useSaveMetric();
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
        await saveMetric({
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

export const useDuplicateMetric = () => {
  return useMutation({
    mutationFn: duplicateMetric
  });
};
