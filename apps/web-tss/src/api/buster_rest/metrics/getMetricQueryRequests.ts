import {
  type QueryClient,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import last from 'lodash/last';
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

  const { selectedVersionNumber, paramVersionNumber, latestVersionNumber } =
    useGetMetricVersionNumber(id || '', versionNumberProp);

  const initialQueryFn = async (version?: number | 'LATEST') => {
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

  const { isFetched: isFetchedInitial, isError: isErrorInitial } = useQuery({
    ...metricsQueryKeys.metricsGetMetric(id || '', 'LATEST'),
    queryFn: () => initialQueryFn(),
    enabled: false, //In the year of our lord 2025, April 10, I, Nate Kelley, decided to disable this query in favor of explicityly fetching the data. May god have mercy on our souls.
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
    queryFn: () => initialQueryFn(selectedVersionNumber),
    select: params?.select,
  });
};

export const usePrefetchGetMetricClient = <TData = BusterMetric>(
  params?: Omit<UseQueryOptions<BusterMetric, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();
  const getLatestMetricVersion = useGetLatestMetricVersionMemoized();

  return useMemoizedFn(
    async ({ id, versionNumber }: { id: string; versionNumber: number | undefined }) => {
      const latestVersionNumber = getLatestMetricVersion(id);
      const options = metricsQueryKeys.metricsGetMetric(
        id,
        versionNumber || latestVersionNumber || 'LATEST'
      );
      const existingData = queryClient.getQueryData(options.queryKey);
      if (!existingData) {
        await queryClient.prefetchQuery({
          ...options,
          queryFn: async () => {
            const result = await getMetric({ id, version_number: versionNumber });
            return upgradeMetricToIMetric(result, null);
          },
          ...params,
        });
      }
    }
  );
};

export const useGetMetricData = <TData = BusterMetricDataExtended>(
  {
    id,
    versionNumber: versionNumberProp,
  }: {
    id: string | undefined;
    versionNumber?: number | 'LATEST';
  },
  params?: Omit<UseQueryOptions<BusterMetricData, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const password = getProtectedAssetPassword(id || '');
  const { selectedVersionNumber } = useGetMetricVersionNumber(id || '', versionNumberProp);
  const {
    isFetched: isFetchedMetric,
    isError: isErrorMetric,
    dataUpdatedAt,
    data: metric,
  } = useGetMetric(
    { id, versionNumber: selectedVersionNumber },
    { select: (x) => ({ id: x.id, version_number: x.version_number }) }
  );

  const queryFn = async () => {
    const chosenVersionNumber: number | undefined =
      versionNumberProp === 'LATEST' ? undefined : versionNumberProp;
    const result = await getMetricData({
      id: id || '',
      version_number: chosenVersionNumber || undefined,
      password,
    });

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
        !!metric?.id &&
        !!dataUpdatedAt &&
        !!selectedVersionNumber
      );
    },
    select: params?.select,
    ...params,
  });
};

export const prefetchGetMetric = async (
  { id, version_number }: { id: string; version_number: number | undefined },
  queryClient: QueryClient
) => {
  const options = metricsQueryKeys.metricsGetMetric(id, version_number || 'LATEST');
  const existingData = queryClient.getQueryData(options.queryKey);
  if (!existingData) {
    await queryClient.prefetchQuery({
      ...options,
      queryFn: () => getMetric({ id, version_number }),
    });
  }
  return existingData;
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
