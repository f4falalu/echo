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
import { BusterDashboard } from '@/api/asset_interfaces/dashboard';
import { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';

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
      const previousData = queryClient.getQueryData(queryKey);
      if (previousData) {
        const newDashboard: BusterDashboard = {
          ...previousData.dashboard,
          ...variables
        };
        const {} = variables;

        //TODO: optimistically update the dashboard

        queryClient.setQueryData(queryKey, (v) => {
          return { ...v!, dashboard: newDashboard };
        });
      }
    }
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
