import {
  type QueryClient,
  type UseQueryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import type { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import type { RustApiError } from '@/api/errors';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { setProtectedAssetPasswordError } from '@/context/BusterAssets/useProtectedAssetStore';
import { isQueryStale } from '@/lib/query';
import { hasOrganizationId } from '../../users/userQueryHelpers';
import {
  getDashboardAndInitializeMetrics,
  useGetDashboardAndInitializeMetrics,
} from '../dashboardQueryHelpers';
import { useGetDashboardVersionNumber } from '../dashboardVersionNumber';

/**
 * useGetDashboard
 * Fetches a dashboard by id and selected version number. Also primes the cache
 * for the latest version to ensure version switching is seamless.
 */
export const useGetDashboard = <TData = BusterDashboardResponse>(
  {
    id: idProp,
    versionNumber: versionNumberProp = 'LATEST',
  }: { id: string | undefined; versionNumber?: number | 'LATEST' },
  params?: Omit<
    UseQueryOptions<BusterDashboardResponse, RustApiError, TData>,
    'queryKey' | 'queryFn'
  >
) => {
  const id = idProp || '';
  const queryFn = useGetDashboardAndInitializeMetrics();

  const { selectedVersionNumber } = useGetDashboardVersionNumber(id, versionNumberProp);

  const { isFetched: isFetchedInitial, isError: isErrorInitial } = useQuery({
    ...dashboardQueryKeys.dashboardGetDashboard(id, 'LATEST'),
    queryFn: () => queryFn(id, 'LATEST'),
    enabled: false,
    retry(_failureCount, error) {
      if (error?.message !== undefined) {
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
    ...dashboardQueryKeys.dashboardGetDashboard(id, selectedVersionNumber),
    queryFn: () => queryFn(id, selectedVersionNumber),
    enabled: isFetchedInitial && !isErrorInitial,
    select: params?.select,
  });
};

/**
 * usePrefetchGetDashboardClient
 * Returns a function that will prefetch a dashboard if its cache entry is stale.
 */
export const usePrefetchGetDashboardClient = <TData = BusterDashboardResponse>(
  params?: Omit<
    UseQueryOptions<BusterDashboardResponse, RustApiError, TData>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryClient = useQueryClient();
  const queryFn = useGetDashboardAndInitializeMetrics({ prefetchData: false });
  return (id: string, versionNumber: number | 'LATEST' = 'LATEST') => {
    const getDashboardQueryKey = dashboardQueryKeys.dashboardGetDashboard(id, versionNumber);
    const isStale = isQueryStale(getDashboardQueryKey, queryClient) || params?.staleTime === 0;
    if (!isStale) return;
    return queryClient.prefetchQuery({
      ...dashboardQueryKeys.dashboardGetDashboard(id, versionNumber),
      queryFn: () => queryFn(id, versionNumber),
      ...params,
    });
  };
};

/**
 * useGetDashboardsList
 * Returns the dashboards list using a compiled set of filters.
 */
export const useGetDashboardsList = (
  params: Omit<
    Parameters<typeof import('../requests').dashboardsGetList>[0],
    'page_token' | 'page_size'
  >,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof import('../requests').dashboardsGetList>>,
      RustApiError
    >,
    'queryKey' | 'queryFn' | 'initialData'
  >
) => {
  const filters = useMemo(() => {
    return {
      ...params,
      page_token: 0,
      page_size: 3500,
    };
  }, [params]);

  return useQuery({
    ...dashboardQueryKeys.dashboardGetList(filters),
    queryFn: () => import('../requests').then((m) => m.dashboardsGetList(filters)),
    ...options,
  });
};

/**
 * prefetchGetDashboardsList
 * Prefetches the dashboards list if it is stale and the org id is present.
 */
export const prefetchGetDashboardsList = async (
  queryClient: import('@tanstack/react-query').QueryClient,
  params?: Parameters<typeof import('../requests').dashboardsGetList>[0]
) => {
  const options = dashboardQueryKeys.dashboardGetList(params);
  const isStale = isQueryStale(options, queryClient);
  if (!isStale || !hasOrganizationId(queryClient)) return queryClient;

  const lastQueryKey = options.queryKey[options.queryKey.length - 1];
  const compiledParams = lastQueryKey as Parameters<
    typeof import('../requests').dashboardsGetList
  >[0];

  await queryClient.prefetchQuery({
    ...options,
    queryFn: () => import('../requests').then((m) => m.dashboardsGetList(compiledParams)),
  });

  return queryClient;
};

export const prefetchGetDashboard = async (
  id: string,
  version_number: number | undefined,
  queryClient: QueryClient
) => {
  const chosenVersionNumber = version_number || 'LATEST';
  const queryFn = async () => {
    return getDashboardAndInitializeMetrics({
      id,
      version_number: chosenVersionNumber,
      queryClient,
      prefetchMetricsData: false,
      shouldInitializeMetrics: true,
    });
  };
  await queryClient.prefetchQuery({
    ...dashboardQueryKeys.dashboardGetDashboard(id, chosenVersionNumber),
    queryFn,
  });
};
