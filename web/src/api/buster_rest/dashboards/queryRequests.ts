import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  dashboardsGetList,
  dashboardsGetDashboard,
  dashboardsCreateDashboard,
  dashboardsUpdateDashboard,
  dashboardsDeleteDashboard
} from './requests';
import type { DashboardsListRequest } from '@/api/request_interfaces/dashboards/interfaces';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { BusterDashboard, BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { create } from 'mutative';

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

export const useGetDashboard = (id: string | undefined) => {
  return useQuery({
    ...dashboardQueryKeys.dashboardGetDashboard(id!),
    queryFn: () => dashboardsGetDashboard(id!),
    enabled: !!id
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
        onOk: () => {
          method();
        },
        useReject: true
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
