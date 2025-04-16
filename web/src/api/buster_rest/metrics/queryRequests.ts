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
  updateMetricShare,
  bulkUpdateMetricVerificationStatus
} from './requests';
import { prepareMetricUpdateMetric, upgradeMetricToIMetric } from '@/lib/metrics';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { useMemo } from 'react';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useGetUserFavorites } from '../users';
import type {
  BusterMetricData,
  IBusterMetric,
  IBusterMetricData
} from '@/api/asset_interfaces/metric';
import { create } from 'mutative';
import {
  useAddAssetToCollection,
  useRemoveAssetFromCollection
} from '../collections/queryRequests';
import { useParams, useSearchParams } from 'next/navigation';
import { useOriginalMetricStore } from '@/context/Metrics/useOriginalMetricStore';
import { RustApiError } from '../../buster_rest/errors';
import last from 'lodash/last';

export const useGetMetricVersionNumber = (props?: {
  versionNumber?: number | null; //if null it will not use a params from the query params
}) => {
  const { versionNumber: versionNumberProp } = props || {};
  const { versionNumber: versionNumberPathParam, metricId: metricIdPathParam } = useParams() as {
    versionNumber: string | undefined;
    metricId: string | undefined;
  };
  const versionNumberQueryParam = useSearchParams().get('metric_version_number');
  const versionNumberFromParams = metricIdPathParam
    ? versionNumberQueryParam || versionNumberPathParam
    : undefined;

  const versionNumber = useMemo(() => {
    if (versionNumberProp === null) return undefined;
    return (
      versionNumberProp ??
      (versionNumberFromParams ? parseInt(versionNumberFromParams!) : undefined)
    );
  }, [versionNumberProp, versionNumberFromParams]);

  return versionNumber;
};

/**
 * This is a hook that will use the version number from the URL params if it exists.
 */
export const useGetMetric = <TData = IBusterMetric>(
  {
    id,
    versionNumber: versionNumberProp
  }: {
    id: string | undefined;
    versionNumber?: number | null; //if null it will not use a params from the query params
  },
  params?: Omit<UseQueryOptions<IBusterMetric, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();
  const setOriginalMetric = useOriginalMetricStore((x) => x.setOriginalMetric);
  const getAssetPassword = useBusterAssetsContextSelector((x) => x.getAssetPassword);
  const setAssetPasswordError = useBusterAssetsContextSelector((x) => x.setAssetPasswordError);
  const { password } = getAssetPassword(id!);

  const versionNumber = useGetMetricVersionNumber({ versionNumber: versionNumberProp });

  const options = metricsQueryKeys.metricsGetMetric(id!, versionNumber);

  const queryFn = useMemoizedFn(async () => {
    const result = await getMetric({ id: id!, password, version_number: versionNumber });
    const oldMetric = queryClient.getQueryData(options.queryKey);
    const updatedMetric = upgradeMetricToIMetric(result, oldMetric || null);

    const isLatestVersion =
      updatedMetric.version_number === last(updatedMetric.versions)?.version_number;

    if (isLatestVersion) setOriginalMetric(updatedMetric);

    if (!versionNumber && result?.version_number) {
      queryClient.setQueryData(
        metricsQueryKeys.metricsGetMetric(result.id, result.version_number).queryKey,
        updatedMetric
      );
    }

    return updatedMetric;
  });

  return useQuery({
    ...options,
    queryFn,
    enabled: false, //In the year of our lord 2025, April 10, I, Nate Kelley, decided to disable this query in favor of explicityly fetching the data. May god have mercy on our souls.
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
export const useGetMetricData = <TData = IBusterMetricData>(
  {
    id,
    versionNumber: versionNumberProp
  }: {
    id: string | undefined;
    versionNumber?: number;
  },
  params?: Omit<UseQueryOptions<BusterMetricData, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const getAssetPassword = useBusterAssetsContextSelector((x) => x.getAssetPassword);
  const { password } = getAssetPassword(id!);
  const versionNumberFromParams = useGetMetricVersionNumber({ versionNumber: versionNumberProp });
  const {
    isFetched: isFetchedMetric,
    isError: isErrorMetric,
    dataUpdatedAt,
    data: metric
  } = useGetMetric(
    { id, versionNumber: versionNumberFromParams },
    { select: (x) => ({ id: x.id, version_number: x.version_number }) }
  );
  const versionNumber = useMemo(() => {
    if (versionNumberFromParams) return versionNumberFromParams;
    return metric?.version_number;
  }, [versionNumberFromParams, metric]);

  const queryFn = useMemoizedFn(async () => {
    const result = await getMetricData({
      id: id!,
      version_number: versionNumber,
      password
    });

    return result;
  });

  return useQuery({
    ...metricsQueryKeys.metricsGetData(id!, versionNumber),
    queryFn,
    enabled: () => {
      return (
        !!id &&
        isFetchedMetric &&
        !isErrorMetric &&
        !!metric?.id &&
        !!dataUpdatedAt &&
        !!versionNumber
      );
    },
    select: params?.select,
    ...params
  });
};

export const prefetchGetMetricDataClient = async (
  { id, version_number }: { id: string; version_number: number | undefined },
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
  const setOriginalMetric = useOriginalMetricStore((x) => x.setOriginalMetric);
  const versionNumber = useGetMetricVersionNumber();

  return useMutation({
    mutationFn: updateMetric,
    onMutate: async ({ id, update_version, restore_to_version }) => {
      const isRestoringVersion = restore_to_version !== undefined;
      const isUpdatingVersion = update_version === true;
      //set the current metric to the previous it is being restored to
      if (isRestoringVersion) {
        const oldMetric = queryClient.getQueryData(
          metricsQueryKeys.metricsGetMetric(id, versionNumber).queryKey
        );
        const newMetric = queryClient.getQueryData(
          metricsQueryKeys.metricsGetMetric(id, restore_to_version).queryKey
        );
        const newMetricData = queryClient.getQueryData(
          metricsQueryKeys.metricsGetData(id, restore_to_version).queryKey
        );
        if (oldMetric && newMetric && newMetricData) {
          queryClient.setQueryData(
            metricsQueryKeys.metricsGetMetric(id, versionNumber).queryKey,
            oldMetric
          );
          queryClient.setQueryData(metricsQueryKeys.metricsGetData(id).queryKey, newMetricData);
        }
      }

      if (isUpdatingVersion) {
        const metric = queryClient.getQueryData(
          metricsQueryKeys.metricsGetMetric(id, versionNumber).queryKey
        );
        const metricVersionNumber = metric?.version_number;
        const metricData = queryClient.getQueryData(
          metricsQueryKeys.metricsGetData(id, metricVersionNumber).queryKey
        );
        const newVersionNumber = (metricVersionNumber ?? 0) + 1;

        if (metric && metricData) {
          queryClient.setQueryData(
            metricsQueryKeys.metricsGetData(id, newVersionNumber).queryKey,
            metricData
          );
        }
      }
    },
    onSuccess: (data, variables) => {
      const oldMetric = queryClient.getQueryData(
        metricsQueryKeys.metricsGetMetric(data.id, data.version_number).queryKey
      );
      const newMetric = upgradeMetricToIMetric(data, oldMetric || null);
      if (updateOnSave && data) {
        queryClient.setQueryData(
          metricsQueryKeys.metricsGetMetric(data.id, data.version_number).queryKey,
          newMetric
        );
        //We need to update BOTH the versioned and the non-versioned metric for version updates to keep the latest up to date
        if (variables.update_version) {
          queryClient.setQueryData(
            metricsQueryKeys.metricsGetMetric(data.id, undefined).queryKey,
            newMetric
          );
        }
      }
      setOriginalMetric(newMetric);
    }
  });
};

export const useDeleteMetric = () => {
  const queryClient = useQueryClient();
  const versionNumber = useGetMetricVersionNumber();
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
          queryKey: metricsQueryKeys.metricsGetMetric(metricId, versionNumber).queryKey,
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
  const versionNumber = useGetMetricVersionNumber();
  return useMutation({
    mutationFn: shareMetric,
    onMutate: (variables) => {
      const queryKey = metricsQueryKeys.metricsGetMetric(variables.id, versionNumber).queryKey;
      queryClient.setQueryData(queryKey, (previousData: IBusterMetric | undefined) => {
        return create(previousData!, (draft: IBusterMetric) => {
          draft.individual_permissions = [
            ...variables.params,
            ...(draft.individual_permissions || [])
          ];
        });
      });
    },
    onSuccess: (data) => {
      const oldMetric = queryClient.getQueryData(
        metricsQueryKeys.metricsGetMetric(data.id, data.version_number).queryKey
      );
      const upgradedMetric = upgradeMetricToIMetric(data, oldMetric || null);

      queryClient.setQueryData(
        metricsQueryKeys.metricsGetMetric(data.id, data.version_number).queryKey,
        upgradedMetric
      );
    }
  });
};

//remove a user from a metric
export const useUnshareMetric = () => {
  const queryClient = useQueryClient();
  const versionNumber = useGetMetricVersionNumber();
  return useMutation({
    mutationFn: unshareMetric,
    onMutate: (variables) => {
      const queryKey = metricsQueryKeys.metricsGetMetric(variables.id, versionNumber).queryKey;
      queryClient.setQueryData(queryKey, (previousData: IBusterMetric | undefined) => {
        return create(previousData!, (draft: IBusterMetric) => {
          draft.individual_permissions =
            draft.individual_permissions?.filter((t) => !variables.data.includes(t.email)) || [];
        });
      });
    },
    onSuccess: (data) => {
      const oldMetric = queryClient.getQueryData(
        metricsQueryKeys.metricsGetMetric(data.id, data.version_number).queryKey
      );
      const upgradedMetric = upgradeMetricToIMetric(data, oldMetric || null);
      queryClient.setQueryData(
        metricsQueryKeys.metricsGetMetric(data.id, data.version_number).queryKey,
        upgradedMetric
      );
    }
  });
};

//update the share settings for a metric
export const useUpdateMetricShare = () => {
  const queryClient = useQueryClient();
  const versionNumber = useGetMetricVersionNumber();

  return useMutation({
    mutationFn: updateMetricShare,
    onMutate: (variables) => {
      const queryKey = metricsQueryKeys.metricsGetMetric(variables.id, versionNumber).queryKey;
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
  updateOnSave?: boolean;
  updateVersion?: boolean;
  saveToServer?: boolean;
}) => {
  const { updateOnSave = false, updateVersion = false, saveToServer = false } = params || {};
  const queryClient = useQueryClient();
  const { mutateAsync: saveMetric } = useSaveMetric({ updateOnSave });
  const getOriginalMetric = useOriginalMetricStore((x) => x.getOriginalMetric);
  const versionNumber = useGetMetricVersionNumber();
  const saveMetricToServer = useMemoizedFn(
    async (newMetric: IBusterMetric, prevMetric: IBusterMetric) => {
      const changedValues = prepareMetricUpdateMetric(newMetric, prevMetric);
      if (changedValues) {
        await saveMetric({ ...changedValues, update_version: updateVersion });
      }
    }
  );

  const combineAndSaveMetric = useMemoizedFn(
    ({
      id: metricId,
      ...newMetricPartial
    }: Omit<Partial<IBusterMetric>, 'status'> & { id: string }) => {
      const options = metricsQueryKeys.metricsGetMetric(metricId, versionNumber);
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
    async (newMetricPartial: Omit<Partial<IBusterMetric>, 'status'> & { id: string }) => {
      const { newMetric, prevMetric } = combineAndSaveMetric(newMetricPartial);

      if (newMetric && prevMetric && saveToServer) {
        return await saveMetricToServer(newMetric, prevMetric);
      }

      return newMetric;
    }
  );

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (data) {
        //THIS CAN BE SERVER DATA, but not always. This is from the mutationFn
        queryClient.setQueryData(
          metricsQueryKeys.metricsGetMetric(data.id, data.version_number).queryKey,
          data
        );
      }
    }
  });
};

export const useBulkUpdateMetricVerificationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkUpdateMetricVerificationStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: metricsQueryKeys.metricsGetList({}).queryKey });
      data.updated_metrics.forEach((metric) => {
        const oldMetric = queryClient.getQueryData(
          metricsQueryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey
        );
        const upgradedMetric = upgradeMetricToIMetric(metric, oldMetric || null);
        queryClient.setQueryData(
          metricsQueryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey,
          upgradedMetric
        );
      });
    }
  });
};
