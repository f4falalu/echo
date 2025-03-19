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
    ...dashboardQueryKeys.dashboardGetList(filters),
    queryFn: () => dashboardsGetList(filters)
  });
};

export const useGetDashboard = <TData = BusterDashboardResponse>(
  id: string | undefined,
  select?: (data: BusterDashboardResponse) => TData
) => {
  const queryClient = useQueryClient();
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const { password } = getAssetPassword(id!);

  const initializeMetrics = useMemoizedFn((metrics: BusterDashboardResponse['metrics']) => {
    for (const metric of Object.values(metrics)) {
      const prevMetric = queryClient.getQueryData(queryKeys.metricsGetMetric(metric.id).queryKey);
      const upgradedMetric = upgradeMetricToIMetric(metric, prevMetric);
      queryClient.setQueryData(queryKeys.metricsGetMetric(metric.id).queryKey, upgradedMetric);
      prefetchGetMetricDataClient({ id: metric.id }, queryClient);
    }
  });

  const queryFn = useMemoizedFn(async () => {
    return dashboardsGetDashboard({ id: id!, password }).then((data) => {
      initializeMetrics(data.metrics);
      return data;
    });
  });

  return useQuery({
    ...dashboardQueryKeys.dashboardGetDashboard(id!),
    queryFn: queryFn,
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
      const method = () => {
        const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
        dashboardsDeleteDashboard({ ids });
      };
      if (ignoreConfirm) {
        return method();
      }
      return await openConfirmModal({
        title: 'Delete Dashboard',
        content: 'Are you sure you want to delete this dashboard?',
        onOk: method
      });
    }
  );

  return useMutation({
    mutationFn: onDeleteDashboard,
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetList({}).queryKey;
      queryClient.setQueryData(queryKey, (v) => {
        const ids =
          typeof variables.dashboardId === 'string'
            ? [variables.dashboardId]
            : variables.dashboardId;
        return v?.filter((t) => !ids.includes(t.id)) || [];
      });
    }
  });
};

export const useAddDashboardToCollection = () => {
  const { mutateAsync: updateDashboardMutation } = useUpdateDashboard();

  const mutationFn = useMemoizedFn(
    async (variables: { dashboardId: string; collectionId: string | string[] }) => {
      const { dashboardId, collectionId } = variables;
      return updateDashboardMutation({
        id: dashboardId,
        add_to_collections: typeof collectionId === 'string' ? [collectionId] : collectionId
      });
    }
  );

  return useMutation({
    mutationFn
  });
};

export const useRemoveDashboardFromCollection = () => {
  const { mutateAsync: updateDashboardMutation } = useUpdateDashboard();

  const mutationFn = useMemoizedFn(
    async (variables: { dashboardId: string; collectionId: string | string[] }) => {
      const { dashboardId, collectionId } = variables;
      return updateDashboardMutation({
        id: dashboardId,
        remove_from_collections: typeof collectionId === 'string' ? [collectionId] : collectionId
      });
    }
  );

  return useMutation({
    mutationFn
  });
};

export const useRemoveItemFromDashboard = () => {
  const { mutateAsync: updateDashboardMutation } = useUpdateDashboard();
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(
    async (variables: { dashboardId: string; metricId: string | string[] }) => {
      const { dashboardId, metricId } = variables;
      const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId);
      const prevDashboard = queryClient.getQueryData(options.queryKey);

      if (prevDashboard) {
        const prevMetricsIds = Object.keys(prevDashboard?.metrics);
        const newMetricsIds = prevMetricsIds?.filter((t) => !metricId.includes(t));
        return updateDashboardMutation({
          id: dashboardId,
          metrics: newMetricsIds
        });
      }
    }
  );
  return useMutation({
    mutationFn
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
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.individual_permissions =
            draft.individual_permissions!.map((t) => {
              const found = variables.data.users?.find((v) => v.email === t.email);
              if (found) return found;
              return t;
            }) || [];

          if (variables.data.publicly_accessible !== undefined) {
            draft.publicly_accessible = variables.data.publicly_accessible;
          }
          if (variables.data.public_password !== undefined) {
            draft.public_password = variables.data.public_password;
          }
          if (variables.data.public_expiry_date !== undefined) {
            draft.public_expiry_date = variables.data.public_expiry_date;
          }
        });
      });
    }
  });
};
