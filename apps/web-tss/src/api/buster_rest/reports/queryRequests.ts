import type {
  GetReportIndividualResponse,
  UpdateReportResponse,
} from '@buster/server-shared/reports';
import {
  QueryClient,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { create } from 'mutative';
import { queryKeys } from '@/api/query_keys';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { reportsQueryKeys } from '@/api/query_keys/reports';
import type { RustApiError } from '../../errors';
import {
  useAddAssetToCollection,
  useRemoveAssetFromCollection,
} from '../collections/queryRequests';
import { useGetUserFavorites } from '../users/favorites';
import {
  getReportById,
  getReportById_server,
  getReportsList,
  getReportsList_server,
  updateReport,
} from './requests';

/**
 * Hook to get a list of reports
 */
export const useGetReportsList = (params?: Parameters<typeof getReportsList>[0]) => {
  const queryFn = () => {
    return getReportsList(params);
  };

  const res = useQuery({
    ...queryKeys.reportsGetList(params),
    queryFn,
  });

  return {
    ...res,
    data: res.data || {
      data: [],
      pagination: { page: 1, page_size: 5000, total: 0, total_pages: 0 },
    },
  };
};

/**
 * Prefetch function for reports list (server-side)
 */
export const prefetchGetReportsList = async (
  params?: Parameters<typeof getReportsList>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...queryKeys.reportsGetList(params),
    queryFn: () => getReportsList_server(params),
  });

  return queryClient;
};

export const prefetchGetReportsListClient = async (
  params?: Parameters<typeof getReportsList>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...queryKeys.reportsGetList(params),
    queryFn: () => getReportsList(params),
  });

  return queryClient;
};

/**
 * Hook to get an individual report by ID
 */
export const useGetReport = <T = GetReportIndividualResponse>(
  { reportId, versionNumber }: { reportId: string | undefined; versionNumber?: number },
  options?: Omit<
    UseQueryOptions<GetReportIndividualResponse, RustApiError, T>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryFn = () => {
    return getReportById(reportId ?? '');
  };

  return useQuery({
    ...queryKeys.reportsGetReport(reportId ?? '', versionNumber),
    queryFn,
    enabled: !!reportId,
    select: options?.select,
    ...options,
  });
};

/**
 * Prefetch function for individual report (server-side)
 */
export const prefetchGetReportById = async (reportId: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...queryKeys.reportsGetReport(reportId),
    queryFn: () => getReportById_server(reportId),
  });

  return queryClient;
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateReportResponse,
    RustApiError,
    Parameters<typeof updateReport>[0],
    { previousReport?: GetReportIndividualResponse }
  >({
    mutationFn: updateReport,
    onMutate: async ({ reportId, ...data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.reportsGetReport(reportId).queryKey,
      });

      // Snapshot the previous value
      const previousReport = queryClient.getQueryData<GetReportIndividualResponse>(
        queryKeys.reportsGetReport(reportId).queryKey
      );

      // Optimistically update the individual report
      if (previousReport) {
        queryClient.setQueryData(
          queryKeys.reportsGetReport(reportId).queryKey,
          create(previousReport, (draft) => {
            if (data.name !== undefined) draft.name = data.name;
            if (data.content !== undefined) draft.content = data.content;
          })
        );
      }

      // Return context with previous values
      return { previousReport };
    },
    onError: (_err, { reportId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousReport) {
        queryClient.setQueryData(
          queryKeys.reportsGetReport(reportId).queryKey,
          context.previousReport
        );
      }
    },
    onSuccess: (data, { reportId, ...updateData }, ctx) => {
      // Update the individual report cache with server response
      queryClient.setQueryData(queryKeys.reportsGetReport(reportId).queryKey, data);

      const nameChanged =
        updateData.name !== undefined &&
        ctx?.previousReport?.name !== undefined &&
        updateData.name !== ctx?.previousReport?.name;

      // Invalidate the list cache to ensure it's fresh
      if (nameChanged) {
        const listQueryKey = queryKeys.reportsGetList().queryKey;
        const hasActiveQuery = queryClient.getQueryCache().find({
          queryKey: listQueryKey,
          exact: true,
          type: 'active',
        });

        if (hasActiveQuery) {
          queryClient.invalidateQueries({
            queryKey: listQueryKey,
            refetchType: 'all',
          });
        } else {
          prefetchGetReportsListClient();
        }
      }
    },
  });
};

export const useAddReportToCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();

  const addReportToCollection = async ({
    reportIds,
    collectionIds,
  }: {
    reportIds: string[];
    collectionIds: string[];
  }) => {
    await Promise.all(
      collectionIds.map((collectionId) =>
        addAssetToCollection({
          id: collectionId,
          assets: reportIds.map((reportId) => ({ id: reportId, type: 'report' })),
        })
      )
    );
  };

  return useMutation({
    mutationFn: addReportToCollection,
    onSuccess: (_, { collectionIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
      });
      if (collectionIsInFavorites) refreshFavoritesList();
      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        ),
        refetchType: 'all',
      });
    },
  });
};

export const useRemoveReportFromCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();

  const removeReportFromCollection = async ({
    reportIds,
    collectionIds,
  }: {
    reportIds: string[];
    collectionIds: string[];
  }) => {
    await Promise.all(
      collectionIds.map((collectionId) =>
        removeAssetFromCollection({
          id: collectionId,
          assets: reportIds.map((reportId) => ({ id: reportId, type: 'report' })),
        })
      )
    );
  };

  return useMutation({
    mutationFn: removeReportFromCollection,
    onSuccess: (_, { collectionIds, reportIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
      });
      if (collectionIsInFavorites) refreshFavoritesList();

      collectionIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: collectionQueryKeys.collectionsGetCollection(id).queryKey,
        });
      });

      reportIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: reportsQueryKeys.reportsGetReport(id).queryKey,
        });
      });
    },
  });
};
