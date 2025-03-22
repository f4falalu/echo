import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  dashboardsGetList,
  dashboardsGetDashboard,
  dashboardsCreateDashboard,
  dashboardsUpdateDashboard,
  dashboardsDeleteDashboard,
  shareDashboard,
  updateDashboardShare,
  unshareDashboard
} from './requests';
import type { DashboardsListRequest } from '@/api/request_interfaces/dashboards/interfaces';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { BusterDashboard, BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { create } from 'mutative';
import { upgradeMetricToIMetric } from '@/lib/metrics';
import { queryKeys } from '@/api/query_keys';
import { prefetchGetMetricDataClient } from '../metrics/queryRequests';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import {
  useAddAssetToCollection,
  useRemoveAssetFromCollection
} from '../collections/queryRequests';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { addMetricToDashboardConfig, removeMetricFromDashboardConfig } from './helpers';
import { addAndRemoveMetricsToDashboard } from './helpers/addAndRemoveMetricsToDashboard';

export const useGetDashboardsList = (
  params: Omit<DashboardsListRequest, 'page_token' | 'page_size'>
) => {
  const filters = useMemo(() => {
    return {
      ...params,
      page_token: 0,
      page_size: 3000
    };
  }, [params]);

  return useQuery({
    ...dashboardQueryKeys.dashboardGetList(params),
    queryFn: () => dashboardsGetList(filters)
  });
};

const useGetDashboardAndInitializeMetrics = () => {
  const queryClient = useQueryClient();
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);

  const initializeMetrics = useMemoizedFn((metrics: BusterDashboardResponse['metrics']) => {
    for (const metric of Object.values(metrics)) {
      const prevMetric = queryClient.getQueryData(queryKeys.metricsGetMetric(metric.id).queryKey);
      const upgradedMetric = upgradeMetricToIMetric(metric, prevMetric);
      queryClient.setQueryData(queryKeys.metricsGetMetric(metric.id).queryKey, upgradedMetric);
      prefetchGetMetricDataClient({ id: metric.id }, queryClient);
    }
  });

  return useMemoizedFn(async (id: string) => {
    const { password } = getAssetPassword?.(id) || {};

    return dashboardsGetDashboard({ id: id!, password }).then((data) => {
      initializeMetrics(data.metrics);
      return data;
    });
  });
};

export const useGetDashboard = <TData = BusterDashboardResponse>(
  id: string | undefined,
  select?: (data: BusterDashboardResponse) => TData
) => {
  const queryFn = useGetDashboardAndInitializeMetrics();
  const queryClient = useQueryClient();

  return useQuery({
    ...dashboardQueryKeys.dashboardGetDashboard(id!),
    queryFn: () => queryFn(id!),
    enabled: !!id,
    select
  });
};

export const useCreateDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardsCreateDashboard,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.dashboardGetList({}).queryKey
      });
    }
  });
};

export const useUpdateDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardsUpdateDashboard,
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        const newDashboardState: BusterDashboardResponse = create(previousData!, (draft) => {
          draft.dashboard = create(draft.dashboard, (draft) => {
            Object.assign(draft, variables);
          });
        });
        return newDashboardState!;
      });
    },
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(variables.id).queryKey,
          data
        );
      }
    }
  });
};

export const useUpdateDashboardConfig = () => {
  const { mutateAsync } = useUpdateDashboard();
  const queryClient = useQueryClient();

  const method = useMemoizedFn(
    async (
      newDashboard: Partial<BusterDashboard['config']> & {
        id: string;
      }
    ) => {
      const options = dashboardQueryKeys.dashboardGetDashboard(newDashboard.id);
      const previousDashboard = queryClient.getQueryData(options.queryKey);
      const previousConfig = previousDashboard?.dashboard?.config;
      if (previousConfig) {
        const newConfig = create(previousConfig!, (draft) => {
          Object.assign(draft, newDashboard);
        });
        return mutateAsync({
          id: newDashboard.id,
          config: newConfig
        });
      }
    }
  );

  return useMutation({
    mutationFn: method
  });
};

export const useDeleteDashboards = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();

  const onDeleteDashboard = useMemoizedFn(
    async ({
      dashboardId,
      ignoreConfirm
    }: {
      dashboardId: string | string[];
      ignoreConfirm?: boolean;
    }) => {
      const onMutate = () => {
        const queryKey = dashboardQueryKeys.dashboardGetList({}).queryKey;
        queryClient.setQueryData(queryKey, (v) => {
          const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
          return v?.filter((t) => !ids.includes(t.id)) || [];
        });
      };

      const method = async () => {
        const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
        onMutate();
        await dashboardsDeleteDashboard({ ids });
      };
      if (ignoreConfirm) {
        return method();
      }
      return await openConfirmModal({
        title: 'Delete Dashboard',
        content: 'Are you sure you want to delete this dashboard?',
        primaryButtonProps: {
          text: 'Delete'
        },
        onOk: method
      });
    }
  );

  return useMutation({
    mutationFn: onDeleteDashboard,
    onSuccess: (_, { dashboardId }) => {
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.dashboardGetList({}).queryKey
      });
    }
  });
};

export const useAddDashboardToCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();
  const mutationFn = useMemoizedFn(
    async (variables: { dashboardId: string; collectionIds: string[] }) => {
      const { dashboardId, collectionIds } = variables;
      return await Promise.all(
        collectionIds.map((collectionId) =>
          addAssetToCollection({
            id: dashboardId,
            assets: [{ id: collectionId, type: 'dashboard' }]
          })
        )
      );
    }
  );
  return useMutation({
    mutationFn,
    onSuccess: (_, { collectionIds }) => {
      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        )
      });
    }
  });
};

export const useRemoveDashboardFromCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();

  const mutationFn = useMemoizedFn(
    async (variables: { dashboardId: string; collectionIds: string[] }) => {
      const { dashboardId, collectionIds } = variables;
      return await Promise.all(
        collectionIds.map((collectionId) =>
          removeAssetFromCollection({
            id: dashboardId,
            assets: [{ id: collectionId, type: 'dashboard' }]
          })
        )
      );
    }
  );
  return useMutation({
    mutationFn,
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(variables.dashboardId).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.collections =
            draft.collections?.filter((t) => !variables.collectionIds.includes(t.id)) || [];
        });
      });
    },
    onSuccess: (_, { collectionIds }) => {
      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        )
      });
    }
  });
};

export const useShareDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shareDashboard,
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.individual_permissions?.push(...variables.params);
        });
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id).queryKey,
        data
      );
    }
  });
};

export const useUnshareDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unshareDashboard,
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.individual_permissions =
            draft.individual_permissions?.filter((t) => !variables.data.includes(t.email)) || [];
        });
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id).queryKey,
        data
      );
    }
  });
};

export const useUpdateDashboardShare = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDashboardShare,
    onMutate: ({ id, params }) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(id).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.individual_permissions =
            draft.individual_permissions?.map((t) => {
              const found = params.users?.find((v) => v.email === t.email);
              if (found) return found;
              return t;
            }) || [];

          if (params.publicly_accessible !== undefined) {
            draft.publicly_accessible = params.publicly_accessible;
          }
          if (params.public_password !== undefined) {
            draft.public_password = params.public_password;
          }
          if (params.public_expiry_date !== undefined) {
            draft.public_expiry_date = params.public_expiry_date;
          }
        });
      });
    }
  });
};

const useEnsureDashboardConfig = () => {
  const queryClient = useQueryClient();
  const prefetchDashboard = useGetDashboardAndInitializeMetrics();
  const { openErrorMessage } = useBusterNotifications();

  const method = useMemoizedFn(async (dashboardId: string) => {
    const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId);
    let dashboardResponse = queryClient.getQueryData(options.queryKey);
    if (!dashboardResponse) {
      const res = await prefetchDashboard(dashboardId).catch((e) => {
        openErrorMessage('Failed to save metrics to dashboard. Dashboard not found');
        return null;
      });
      if (res) {
        queryClient.setQueryData(options.queryKey, res);
        dashboardResponse = res;
      }
    }

    return dashboardResponse;
  });

  return method;
};

export const useAddAndRemoveMetricsFromDashboard = () => {
  const queryClient = useQueryClient();
  const { openErrorMessage } = useBusterNotifications();
  const ensureDashboardConfig = useEnsureDashboardConfig();

  const addMetricToDashboard = useMemoizedFn(
    async ({ metricIds, dashboardId }: { metricIds: string[]; dashboardId: string }) => {
      const dashboardResponse = await ensureDashboardConfig(dashboardId);

      if (dashboardResponse) {
        const newConfig = addAndRemoveMetricsToDashboard(
          metricIds,
          dashboardResponse.dashboard.config
        );
        return dashboardsUpdateDashboard({
          id: dashboardId,
          config: newConfig
        });
      }

      openErrorMessage('Failed to save metrics to dashboard');
    }
  );

  return useMutation({
    mutationFn: addMetricToDashboard,
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(variables.dashboardId).queryKey,
          data
        );
      }
    }
  });
};

export const useAddMetricsToDashboard = () => {
  const queryClient = useQueryClient();
  const { openErrorMessage } = useBusterNotifications();
  const ensureDashboardConfig = useEnsureDashboardConfig();

  const addMetricToDashboard = useMemoizedFn(
    async ({ metricIds, dashboardId }: { metricIds: string[]; dashboardId: string }) => {
      const dashboardResponse = await ensureDashboardConfig(dashboardId);

      if (dashboardResponse) {
        const newConfig = addMetricToDashboardConfig(metricIds, dashboardResponse.dashboard.config);
        return dashboardsUpdateDashboard({
          id: dashboardId,
          config: newConfig
        });
      }

      openErrorMessage('Failed to save metrics to dashboard');
    }
  );

  return useMutation({
    mutationFn: addMetricToDashboard,
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(variables.dashboardId).queryKey,
          data
        );
      }
    }
  });
};

export const useRemoveMetricsFromDashboard = () => {
  const { openConfirmModal, openErrorMessage } = useBusterNotifications();
  const queryClient = useQueryClient();
  const ensureDashboardConfig = useEnsureDashboardConfig();

  const removeMetricFromDashboard = useMemoizedFn(
    async ({
      metricIds,
      dashboardId,
      useConfirmModal = true
    }: {
      metricIds: string[];
      dashboardId: string;
      useConfirmModal?: boolean;
    }) => {
      const method = async () => {
        const dashboardResponse = await ensureDashboardConfig(dashboardId);

        if (dashboardResponse) {
          const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId);
          const newConfig = removeMetricFromDashboardConfig(
            metricIds,
            dashboardResponse.dashboard.config
          );
          queryClient.setQueryData(options.queryKey, (currentDashboard) => {
            return create(currentDashboard!, (draft) => {
              draft.dashboard.config = newConfig;
            });
          });
        }

        if (dashboardResponse) {
          const newConfig = removeMetricFromDashboardConfig(
            metricIds,
            dashboardResponse.dashboard.config
          );
          return await dashboardsUpdateDashboard({
            id: dashboardId,
            config: newConfig
          });
        }

        openErrorMessage('Failed to remove metrics from dashboard');
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

    onSuccess: (data, variables) => {
      if (data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(variables.dashboardId).queryKey,
          data
        );
      }
    }
  });
};
