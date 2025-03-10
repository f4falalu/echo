import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  dashboardsGetList,
  dashboardsGetDashboard,
  dashboardsCreateDashboard,
  dashboardsUpdateDashboard,
  dashboardsDeleteDashboard
} from './requests';
import type {
  DashboardsListRequest,
  DashboardCreateRequest,
  DashboardUpdateRequest,
  DashboardDeleteRequest
} from '@/api/request_interfaces/dashboards/interfaces';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { BusterDashboard } from '@/api/asset_interfaces/dashboard';

export const useGetDashboardsList = (params: DashboardsListRequest) => {
  return useQuery({
    ...dashboardQueryKeys.dashboardGetList(params),
    queryFn: () => dashboardsGetList(params)
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
  return useMutation({
    mutationFn: dashboardsDeleteDashboard,
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetList({}).queryKey;
      queryClient.setQueryData(queryKey, (v) => {
        return v?.filter((t) => !variables.ids.includes(t.id)) || [];
      });
    }
  });
};
