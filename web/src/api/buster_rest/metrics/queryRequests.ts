import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { useDebounceFn, useMemoizedFn, useMount, useUnmount } from '@/hooks';
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
import { prepareMetricUpdateMetric, upgradeMetricToIMetric } from '@/lib/metrics';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { useMemo } from 'react';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useGetUserFavorites } from '../users';
import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { create } from 'mutative';
import {
  useAddAssetToCollection,
  useRemoveAssetFromCollection
} from '../collections/queryRequests';
import debounce from 'lodash/debounce';

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

export const prefetchGetMetric = async (
  params: Parameters<typeof getMetric_server>[0],
  queryClientProp?: QueryClient
) => {
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

export const useGetMetricsList = (
  params: Omit<Parameters<typeof listMetrics>[0], 'page_token' | 'page_size'>
) => {
  const compiledParams: Parameters<typeof listMetrics>[0] = useMemo(
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
  params: Parameters<typeof listMetrics>[0],
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

export const useSaveMetricToCollections = () => {
  const queryClient = useQueryClient();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();

  const saveMetricToCollection = useMemoizedFn(
    async ({ metricIds, collectionIds }: { metricIds: string[]; collectionIds: string[] }) => {
      await Promise.all(
        collectionIds.map((collectionId) =>
          addAssetToCollection({
            id: collectionId,
            assets: metricIds.map((metricId) => ({ id: metricId, type: 'metric' }))
          })
        )
      );
    }
  );

  return useMutation({
    mutationFn: saveMetricToCollection,
    onSuccess: (_, { collectionIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
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
    async ({ metricIds, collectionIds }: { metricIds: string[]; collectionIds: string[] }) => {
      await Promise.all(
        collectionIds.map((collectionId) =>
          removeAssetFromCollection({
            id: collectionId,
            assets: metricIds.map((metricId) => ({ id: metricId, type: 'metric' }))
          })
        )
      );
    }
  );

  return useMutation({
    mutationFn: removeMetricFromCollection,
    onSuccess: (_, { collectionIds, metricIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
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

export const useUpdateMetric = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: saveMetric } = useSaveMetric();

  const { run: saveMetricDebounced } = useDebounceFn(
    useMemoizedFn((newMetric: IBusterMetric, prevMetric: IBusterMetric) => {
      const changedValues = prepareMetricUpdateMetric(newMetric, prevMetric);
      if (changedValues) {
        saveMetric(changedValues);
      }
    }),
    { wait: 650, leading: false }
  );

  const combineAndSaveMetric = useMemoizedFn(
    async (newMetricPartial: Partial<IBusterMetric> & { id: string }) => {
      const metricId = newMetricPartial.id;
      const options = metricsQueryKeys.metricsGetMetric(metricId);
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
        saveMetricDebounced(newMetric, prevMetric);
      }
      return newMetric;
    }
  );

  const mutationRes = useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(metricsQueryKeys.metricsGetMetric(data.id).queryKey, data);
      }
    }
  });

  return mutationRes;
};
