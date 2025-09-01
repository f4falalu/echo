import {
  type QueryClient,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import last from 'lodash/last';
import { useCallback } from 'react';
import type {
  BusterMetric,
  BusterMetricData,
  BusterMetricDataExtended,
} from '@/api/asset_interfaces/metric';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import {
  getProtectedAssetPassword,
  setProtectedAssetPasswordError,
} from '@/context/BusterAssets/useProtectedAssetStore';
import { setOriginalMetric } from '@/context/Metrics/useOriginalMetricStore';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { upgradeMetricToIMetric } from '@/lib/metrics';
import type { RustApiError } from '../../errors';
import {
  useGetLatestMetricVersionMemoized,
  useGetMetricVersionNumber,
} from './metricVersionNumber';
import { downloadMetricFile, getMetric, getMetricData } from './requests';

const getMetricQueryFn = async ({
  id,
  version,
  password,
  queryClient,
}: {
  id: string | undefined;
  version: number | undefined | 'LATEST';
  password: string | undefined;
  queryClient: QueryClient;
}) => {
  const chosenVersionNumber: number | undefined = version === 'LATEST' ? undefined : version;
  const result = await getMetric({
    id: id || '',
    password,
    version_number: chosenVersionNumber,
  });
  const updatedMetric = upgradeMetricToIMetric(result, null);
  const isLatestVersion =
    updatedMetric.version_number === last(updatedMetric.versions)?.version_number;

  if (isLatestVersion) {
    setOriginalMetric(updatedMetric);
  }

  if (result?.version_number) {
    queryClient.setQueryData(
      metricsQueryKeys.metricsGetMetric(result.id, result.version_number).queryKey,
      updatedMetric
    );
  }
  return updatedMetric;
};

export const useGetMetric = <TData = BusterMetric>(
  {
    id,
    versionNumber: versionNumberProp,
  }: {
    id: string | undefined;
    versionNumber?: number | 'LATEST'; //if null it will not use a params from the query params
  },
  params?: Omit<UseQueryOptions<BusterMetric, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();
  const password = getProtectedAssetPassword(id || '');

  const { selectedVersionNumber, latestVersionNumber } = useGetMetricVersionNumber(
    id || '',
    versionNumberProp
  );

  const { isFetched: isFetchedInitial, isError: isErrorInitial } = useQuery({
    ...metricsQueryKeys.metricsGetMetric(id || '', 'LATEST'),
    queryFn: () => getMetricQueryFn({ id, version: 'LATEST', password, queryClient }),
    retry(_failureCount, error) {
      if (error?.message !== undefined && id) {
        setProtectedAssetPasswordError({
          assetId: id,
          error: error.message || 'An error occurred',
        });
      }
      return false;
    },
    select: undefined,
    ...params,
  });

  return useQuery({
    ...metricsQueryKeys.metricsGetMetric(id || '', selectedVersionNumber),
    enabled: !!latestVersionNumber && isFetchedInitial && !isErrorInitial,
    queryFn: () => getMetricQueryFn({ id, version: selectedVersionNumber, password, queryClient }),
    select: params?.select,
  });
};

export const usePrefetchGetMetricClient = () => {
  const queryClient = useQueryClient();
  return useMemoizedFn(
    async ({ id, versionNumber }: { id: string; versionNumber: number | undefined }) => {
      return prefetchGetMetric({ id, version_number: versionNumber }, queryClient);
    }
  );
};

export const prefetchGetMetric = async (
  params: Parameters<typeof getMetric>[0],
  queryClient: QueryClient
): Promise<BusterMetric | undefined> => {
  const { id, version_number } = params;
  const queryKey = metricsQueryKeys.metricsGetMetric(id, version_number || 'LATEST')?.queryKey;
  const existingData = queryClient.getQueryData(queryKey);

  if (!existingData) {
    await queryClient.prefetchQuery({
      ...metricsQueryKeys.metricsGetMetric(id, version_number || 'LATEST'),
      queryFn: () =>
        getMetricQueryFn({
          id,
          version: params.version_number,
          password: undefined,
          queryClient,
        }),
    });
  }

  return existingData || queryClient.getQueryData(queryKey);
};

export const useGetMetricData = <TData = BusterMetricDataExtended>(
  {
    id = '',
    versionNumber: versionNumberProp,
  }: {
    id: string | undefined;
    versionNumber?: number | 'LATEST';
  },
  params?: Omit<UseQueryOptions<BusterMetricData, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();
  const password = getProtectedAssetPassword(id);
  const getLatestMetricVersion = useGetLatestMetricVersionMemoized();
  const { selectedVersionNumber } = useGetMetricVersionNumber(id, versionNumberProp);
  const {
    isFetched: isFetchedMetric,
    isError: isErrorMetric,
    dataUpdatedAt,
    data: metricId,
  } = useGetMetric(
    { id, versionNumber: selectedVersionNumber },
    { select: useCallback((x: BusterMetric) => x?.id, []), enabled: params?.enabled !== false }
  );

  const queryFn = async () => {
    const chosenVersionNumber: number | undefined =
      versionNumberProp === 'LATEST' ? undefined : versionNumberProp;
    const result = await getMetricData({
      id,
      version_number: chosenVersionNumber || undefined,
      password,
    });
    const isLatest = versionNumberProp === 'LATEST' || !versionNumberProp;
    if (isLatest) {
      const latestVersionNumber = getLatestMetricVersion(id);
      if (latestVersionNumber) {
        queryClient.setQueryData(
          metricsQueryKeys.metricsGetData(id, latestVersionNumber).queryKey,
          result
        );
      }
    }
    return result;
  };

  return useQuery({
    ...metricsQueryKeys.metricsGetData(id || '', versionNumberProp || 'LATEST'),
    queryFn,
    enabled: () => {
      return (
        !!id &&
        isFetchedMetric &&
        !isErrorMetric &&
        !!metricId &&
        !!dataUpdatedAt &&
        !!selectedVersionNumber
      );
    },
    select: params?.select,
    ...params,
  });
};

export const prefetchGetMetricDataClient = async (
  { id, version_number }: { id: string; version_number: number },
  queryClient: QueryClient
) => {
  const options = metricsQueryKeys.metricsGetData(id, version_number);
  const existingData = queryClient.getQueryData(options.queryKey);
  if (!existingData) {
    await queryClient.prefetchQuery({
      ...options,
      queryFn: () => getMetricData({ id, version_number }),
    });
  }
};

//used in list version histories
export const usePrefetchGetMetricDataClient = () => {
  const queryClient = useQueryClient();
  return useMemoizedFn(({ id, versionNumber }: { id: string; versionNumber: number }) =>
    prefetchGetMetricDataClient({ id, version_number: versionNumber }, queryClient)
  );
};

export const useDownloadMetricFile = () => {
  return useMutation({
    mutationFn: downloadMetricFile,
  });
};
