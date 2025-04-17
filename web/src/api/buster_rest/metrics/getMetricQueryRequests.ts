import { BusterMetricData, IBusterMetric, IBusterMetricData } from '@/api/asset_interfaces/metric';
import { QueryClient, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { RustApiError } from '../errors';
import { useOriginalMetricStore } from '@/context/Metrics/useOriginalMetricStore';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useGetMetricVersionNumber } from './metricQueryHelpers';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { useMemoizedFn } from '@/hooks';
import { getMetric, getMetricData } from './requests';
import { upgradeMetricToIMetric } from '@/lib/metrics';
import last from 'lodash/last';
import { useMemo } from 'react';

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

export const usePrefetchGetMetricClient = () => {
  const queryClient = useQueryClient();
  return useMemoizedFn(
    async ({ id, versionNumber }: { id: string; versionNumber: number | undefined }) => {
      const options = metricsQueryKeys.metricsGetMetric(id, versionNumber);
      const existingData = queryClient.getQueryData(options.queryKey);
      if (!existingData) {
        await queryClient.prefetchQuery({
          ...options,
          queryFn: async () => {
            const result = await getMetric({ id, version_number: versionNumber });
            return upgradeMetricToIMetric(result, null);
          }
        });
      }
    }
  );
};

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

export const usePrefetchGetMetricDataClient = () => {
  const queryClient = useQueryClient();
  return useMemoizedFn(({ id, versionNumber }: { id: string; versionNumber: number | undefined }) =>
    prefetchGetMetricDataClient({ id, version_number: versionNumber }, queryClient)
  );
};
