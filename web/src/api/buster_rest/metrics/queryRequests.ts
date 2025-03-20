import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { useDebounceFn, useMemoizedFn } from '@/hooks';
import {
  deleteMetrics,
  duplicateMetric,
  getMetric,
  getMetric_server,
  getMetricData,
  listMetrics,
  listMetrics_server,
  updateMetric,
  shareMetric,
  unshareMetric,
  updateMetricShare
} from './requests';
import type { GetMetricParams, ListMetricsParams } from './interfaces';
import { upgradeMetricToIMetric } from '@/lib/metrics';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { useMemo } from 'react';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useGetUserFavorites } from '../users';
import { useBusterNotifications } from '@/context/BusterNotifications';
import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { create } from 'mutative';
import {
  useAddAssetToCollection,
  useRemoveAssetFromCollection
} from '../collections/queryRequests';

export const useGetMetric = <TData = IBusterMetric>(
  { id, version_number }: { id: string | undefined; version_number?: number },
  select?: (data: IBusterMetric) => TData
) => {
  const getAssetPassword = useBusterAssetsContextSelector((x) => x.getAssetPassword);
  const setAssetPasswordError = useBusterAssetsContextSelector((x) => x.setAssetPasswordError);
  const { password } = getAssetPassword(id!);

  const queryClient = useQueryClient();
  const options = metricsQueryKeys.metricsGetMetric(id!);

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
    retry(failureCount, error) {
      if (error?.message !== undefined) {
        setAssetPasswordError(id!, error.message || 'An error occurred');
      }
      return false;
    }
  });
};

export const prefetchGetMetric = async (params: GetMetricParams, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...metricsQueryKeys.metricsGetMetric(params.id),
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
    ...metricsQueryKeys.metricsGetList(compiledParams),
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
    ...metricsQueryKeys.metricsGetList(params),
    queryFn: () => listMetrics_server(params)
  });

  return queryClient;
};

export const useGetMetricData = ({
  id,
  version_number
}: {
  id: string;
  version_number?: number;
}) => {
  const queryFn = useMemoizedFn(() => {
    return getMetricData({ id, version_number });
  });
  return useQuery({
    ...metricsQueryKeys.metricsGetData(id),
    queryFn,
    enabled: !!id
  });
};

export const prefetchGetMetricDataClient = async (
  { id }: { id: string },
  queryClient: QueryClient
) => {
  const options = metricsQueryKeys.metricsGetData(id);
  const existingData = queryClient.getQueryData(options.queryKey);
  if (!existingData) {
    await queryClient.prefetchQuery({
      ...options,
      queryFn: () => getMetricData({ id })
    });
  }
};

/**
 * This is a mutation that saves a metric to the server.
 * It will simply use the params passed in and not do any special logic.
 */
export const useSaveMetric = () => {
  return useMutation({
    mutationFn: updateMetric
  });
};

export const useDeleteMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMetrics,
    onMutate: async (variables) => {
      const metricIds = variables.ids;
      const options = metricsQueryKeys.metricsGetList();
      queryClient.setQueryData(options.queryKey, (oldData) => {
        return oldData?.filter((metric) => !metricIds.includes(metric.id));
      });
      for (const metricId of metricIds) {
        queryClient.removeQueries({
          queryKey: metricsQueryKeys.metricsGetMetric(metricId).queryKey,
          exact: true
        });
      }
    }
  });
};

export const useSaveMetricToCollection = () => {
  const queryClient = useQueryClient();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();

  const saveMetricToCollection = useMemoizedFn(
    async ({ metricId, collectionIds }: { metricId: string; collectionIds: string[] }) => {
      await Promise.all(
        collectionIds.map((collectionId) =>
          addAssetToCollection({
            id: metricId,
            assets: [{ id: collectionId, type: 'metric' }]
          })
        )
      );
    }
  );

  return useMutation({
    mutationFn: saveMetricToCollection,
    onSuccess: (_, { collectionIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        const searchId = f.collection_id || f.id;
        return collectionIds.includes(searchId);
      });
      if (collectionIsInFavorites) refreshFavoritesList();
      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        )
      });
    }
  });
};

export const useRemoveMetricFromCollection = () => {
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();
  const queryClient = useQueryClient();

  const removeMetricFromCollection = useMemoizedFn(
    async ({ metricId, collectionIds }: { metricId: string; collectionIds: string[] }) => {
      await Promise.all(
        collectionIds.map((collectionId) =>
          removeAssetFromCollection({
            id: metricId,
            assets: [{ id: collectionId, type: 'metric' }]
          })
        )
      );
    }
  );

  return useMutation({
    mutationFn: removeMetricFromCollection,
    onSuccess: (_, { collectionIds, metricId }) => {
      const currentMetric = queryClient.getQueryData(
        metricsQueryKeys.metricsGetMetric(metricId).queryKey
      );
      const collectionIsInFavorites =
        currentMetric &&
        userFavorites.some((f) => {
          const searchId = f.collection_id || f.id;
          return currentMetric.collections.some((c) => c.id === searchId);
        });

      if (collectionIsInFavorites) refreshFavoritesList();

      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        )
      });
    }
  });
};

export const useSaveMetricToDashboard = () => {
  const queryClient = useQueryClient();

  const saveMetricToDashboard = useMemoizedFn(
    async ({ metricId, dashboardIds }: { metricId: string; dashboardIds: string[] }) => {
      // await saveMetric({
      //   id: metricId,
      //   save_to_dashboard: dashboardIds
      // });
    }
  );

  return useMutation({
    mutationFn: saveMetricToDashboard,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: variables.dashboardIds.map(
          (id) => dashboardQueryKeys.dashboardGetDashboard(id).queryKey
        )
      });
    }
  });
};

export const useRemoveMetricFromDashboard = () => {
  const { openConfirmModal } = useBusterNotifications();
  const { mutateAsync: saveMetric } = useSaveMetric();
  const queryClient = useQueryClient();
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
        // await saveMetric({
        //   id: metricId,
        //   remove_from_dashboard: [dashboardId]
        // });
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
    mutationFn: removeMetricFromDashboard,
    onMutate: async (variables) => {
      const currentDashboard = queryClient.getQueryData(
        dashboardQueryKeys.dashboardGetDashboard(variables.dashboardId).queryKey
      );
      if (currentDashboard) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(variables.dashboardId).queryKey,
          (currentDashboard) => {
            if (currentDashboard?.dashboard.config.rows) {
              currentDashboard.dashboard.config.rows.forEach((row) => {
                row.items = row.items.filter((item) => item.id !== variables.metricId);
              });
            }
            delete currentDashboard!.metrics[variables.metricId];
            return currentDashboard;
          }
        );
      }
    }
  });
};

export const useDuplicateMetric = () => {
  return useMutation({
    mutationFn: duplicateMetric
  });
};

export const useShareMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shareMetric,
    onMutate: (variables) => {
      const queryKey = metricsQueryKeys.metricsGetMetric(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData: IBusterMetric | undefined) => {
        return create(previousData!, (draft: IBusterMetric) => {
          draft.individual_permissions?.push(...variables.params);
        });
      });
    },
    onSuccess: (data) => {
      const oldMetric = queryClient.getQueryData(
        metricsQueryKeys.metricsGetMetric(data.id).queryKey
      );
      const upgradedMetric = upgradeMetricToIMetric(data, oldMetric || null);
      queryClient.setQueryData(metricsQueryKeys.metricsGetMetric(data.id).queryKey, upgradedMetric);
    }
  });
};

export const useUnshareMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unshareMetric,
    onMutate: (variables) => {
      const queryKey = metricsQueryKeys.metricsGetMetric(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData: IBusterMetric | undefined) => {
        return create(previousData!, (draft: IBusterMetric) => {
          draft.individual_permissions =
            draft.individual_permissions?.filter((t) => !variables.data.includes(t.email)) || [];
        });
      });
    },
    onSuccess: (data) => {
      const oldMetric = queryClient.getQueryData(
        metricsQueryKeys.metricsGetMetric(data.id).queryKey
      );
      const upgradedMetric = upgradeMetricToIMetric(data, oldMetric || null);
      queryClient.setQueryData(metricsQueryKeys.metricsGetMetric(data.id).queryKey, upgradedMetric);
    }
  });
};

export const useUpdateMetricShare = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMetricShare,
    onMutate: (variables) => {
      const queryKey = metricsQueryKeys.metricsGetMetric(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData: IBusterMetric | undefined) => {
        return create(previousData!, (draft: IBusterMetric) => {
          draft.individual_permissions =
            draft.individual_permissions?.map((t) => {
              const found = variables.params.users?.find((v) => v.email === t.email);
              if (found) return found;
              return t;
            }) || [];

          if (variables.params.publicly_accessible !== undefined) {
            draft.publicly_accessible = variables.params.publicly_accessible;
          }
          if (variables.params.public_password !== undefined) {
            draft.public_password = variables.params.public_password;
          }
          if (variables.params.public_expiry_date !== undefined) {
            draft.public_expiry_date = variables.params.public_expiry_date;
          }
        });
      });
    }
  });
};
