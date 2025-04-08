'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { useDebounceFn, useMemoizedFn } from '@/hooks';
import {
  deleteMetrics,
  duplicateMetric,
  getMetric,
  getMetricData,
  listMetrics,
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
import { useParams, useSearchParams } from 'next/navigation';
import { useOriginalMetricStore } from '@/context/Metrics/useOriginalMetricStore';
import { RustApiError } from '../../buster_rest/errors';

/**
 * This is a hook that will use the version number from the URL params if it exists.
 */
export const useGetMetric = <TData = IBusterMetric>(
  {
    id,
    version_number: version_number_prop
  }: {
    id: string | undefined;
    version_number?: number | null; //if null it will not use a params from the query params
  },
  params?: Omit<UseQueryOptions<IBusterMetric, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const setOriginalMetric = useOriginalMetricStore((x) => x.setOriginalMetric);
  const pathParams = useParams() as { versionNumber: string | undefined };
  const queryVersionNumber = pathParams.versionNumber
    ? parseInt(pathParams.versionNumber)
    : undefined;
  const getAssetPassword = useBusterAssetsContextSelector((x) => x.getAssetPassword);
  const setAssetPasswordError = useBusterAssetsContextSelector((x) => x.setAssetPasswordError);
  const { password } = getAssetPassword(id!);

  const queryClient = useQueryClient();

  const version_number = useMemo(() => {
    if (version_number_prop === null) return undefined;
    return version_number_prop || queryVersionNumber ? queryVersionNumber! : undefined;
  }, [version_number_prop, queryVersionNumber]);

  const options = useMemo(() => {
    return metricsQueryKeys.metricsGetMetric(id!, version_number);
  }, [id, version_number]);

  const queryFn = useMemoizedFn(async () => {
    const result = await getMetric({ id: id!, password, version_number });
    const oldMetric = queryClient.getQueryData(options.queryKey);
    const updatedMetric = upgradeMetricToIMetric(result, oldMetric || null);
    setOriginalMetric(updatedMetric);
    return updatedMetric;
  });

  return useQuery({
    ...options,
    queryFn,
    enabled: !!id,
    retry(failureCount, error) {
      if (error?.message !== undefined) {
        setAssetPasswordError(id!, error.message || 'An error occurred');
      }
      return false;
    },
    select: params?.select,
    ...params
  });
};

export const useGetMetricsList = (
  params: Omit<Parameters<typeof listMetrics>[0], 'page_token' | 'page_size'>
) => {
  const compiledParams: Parameters<typeof listMetrics>[0] = useMemo(
    () => ({ ...params, page_token: 0, page_size: 3000 }),
    [params]
  );

  const queryFn = useMemoizedFn(() => listMetrics(compiledParams));

  return useQuery({
    ...metricsQueryKeys.metricsGetList(params),
    queryFn
  });
};

/**
 * This is a hook that will use the version number from the URL params if it exists.
 */
export const useGetMetricData = ({
  id,
  version_number: version_number_prop
}: {
  id: string | undefined;
  version_number?: number;
}) => {
  const {
    isFetched: isFetchedMetric,
    error: errorMetric,
    data: fetchedMetricData
  } = useGetMetric({ id }, { select: (x) => x.id });
  const pathParams = useParams() as { versionNumber: string | undefined };
  const queryVersionNumber = pathParams.versionNumber
    ? parseInt(pathParams.versionNumber)
    : undefined;

  const version_number = useMemo(() => {
    return version_number_prop || queryVersionNumber ? queryVersionNumber! : undefined;
  }, [version_number_prop, queryVersionNumber]);

  const queryFn = useMemoizedFn(() => {
    return getMetricData({ id: id!, version_number });
  });

  return useQuery({
    ...metricsQueryKeys.metricsGetData(id!, version_number),
    queryFn,
    enabled: () => {
      return !!id && isFetchedMetric && !errorMetric && !!fetchedMetricData;
    }
  });
};

export const prefetchGetMetricDataClient = async (
  { id, version_number }: { id: string; version_number?: number },
  queryClient: QueryClient
) => {
  const options = metricsQueryKeys.metricsGetData(id, version_number);
  const existingData = queryClient.getQueryData(options.queryKey);
  if (!existingData) {
    await queryClient.prefetchQuery({
      ...options,
      queryFn: () => getMetricData({ id, version_number })
    });
  }
};

/**
 * This is a mutation that saves a metric to the server.
 * It will simply use the params passed in and not do any special logic.
 */
export const useSaveMetric = (params?: { updateOnSave?: boolean }) => {
  const updateOnSave = params?.updateOnSave || false;
  const queryClient = useQueryClient();
  const { setOriginalMetric } = useOriginalMetricStore();

  return useMutation({
    mutationFn: updateMetric,
    onMutate: async ({ id, restore_to_version }) => {
      const isRestoringVersion = restore_to_version !== undefined;
      //set the current metric to the previous it is being restored to
      if (isRestoringVersion) {
        const oldMetric = queryClient.getQueryData(metricsQueryKeys.metricsGetMetric(id).queryKey);
        const newMetric = queryClient.getQueryData(
          metricsQueryKeys.metricsGetMetric(id, restore_to_version).queryKey
        );
        const newMetricData = queryClient.getQueryData(
          metricsQueryKeys.metricsGetData(id, restore_to_version).queryKey
        );
        if (oldMetric && newMetric && newMetricData) {
          queryClient.setQueryData(metricsQueryKeys.metricsGetMetric(id).queryKey, oldMetric);
          queryClient.setQueryData(metricsQueryKeys.metricsGetData(id).queryKey, newMetricData);
        }
      }
    },
    onSuccess: (data) => {
      const oldMetric = queryClient.getQueryData(
        metricsQueryKeys.metricsGetMetric(data.id).queryKey
      );
      const newMetric = upgradeMetricToIMetric(data, oldMetric || null);
      if (updateOnSave && data) {
        queryClient.setQueryData(metricsQueryKeys.metricsGetMetric(data.id).queryKey, newMetric);
      }
      setOriginalMetric(newMetric);
    }
  });
};

export const useDeleteMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMetrics,
    onMutate: async (variables) => {
      const metricIds = variables.ids;
      const options = metricsQueryKeys.metricsGetList({});
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

//add a user to a metric
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

//remove a user from a metric
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

//update the share settings for a metric
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

export const useUpdateMetric = (params: {
  wait?: number;
  updateOnSave?: boolean;
  updateVersion?: boolean;
  saveToServer?: boolean;
}) => {
  const {
    wait = 0,
    updateOnSave = false,
    updateVersion = true,
    saveToServer = false
  } = params || {};
  const queryClient = useQueryClient();
  const { mutateAsync: saveMetric } = useSaveMetric({ updateOnSave });
  const getOriginalMetric = useOriginalMetricStore((x) => x.getOriginalMetric);

  const { run: saveMetricToServerDebounced } = useDebounceFn(
    useMemoizedFn(async (newMetric: IBusterMetric, prevMetric: IBusterMetric) => {
      const changedValues = prepareMetricUpdateMetric(newMetric, prevMetric);
      if (changedValues) {
        await saveMetric({ ...changedValues, update_version: updateVersion });
      }
    }),
    { wait, leading: false }
  );

  const combineAndSaveMetric = useMemoizedFn(
    (newMetricPartial: Partial<IBusterMetric> & { id: string }) => {
      const metricId = newMetricPartial.id;
      const options = metricsQueryKeys.metricsGetMetric(metricId);
      const prevMetric = getOriginalMetric(metricId);
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
      const { newMetric, prevMetric } = combineAndSaveMetric(newMetricPartial);

      if (newMetric && prevMetric && saveToServer) {
        return await saveMetricToServerDebounced(newMetric, prevMetric);
      }

      return newMetric;
    }
  );

  const mutationRes = useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (data) {
        //THIS CAN BE SERVER DATA, but not always. This is from the mutationFn
        queryClient.setQueryData(metricsQueryKeys.metricsGetMetric(data.id).queryKey, data);
      }
    }
  });

  return mutationRes;
};
