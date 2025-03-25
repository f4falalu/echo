import { queryOptions } from '@tanstack/react-query';
import type {
  BusterDashboardListItem,
  BusterDashboardResponse
} from '@/api/asset_interfaces/dashboard';
import { dashboardsGetList } from '../buster_rest/dashboards';

const dashboardGetList = (
  filters: Omit<Parameters<typeof dashboardsGetList>[0], 'page_token' | 'page_size'>
) =>
  queryOptions<BusterDashboardListItem[]>({
    queryKey: ['dashboard', 'list', filters] as const,
    staleTime: 10 * 1000,
    initialData: [],
    initialDataUpdatedAt: 0
  });

const dashboardGetDashboard = (dashboardId: string) =>
  queryOptions<BusterDashboardResponse>({
    queryKey: ['dashboard', 'get', dashboardId] as const,
    staleTime: 10 * 1000
  });

export const dashboardQueryKeys = {
  dashboardGetDashboard,
  dashboardGetList
};
