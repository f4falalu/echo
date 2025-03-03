import { queryOptions } from '@tanstack/react-query';
import type {
  BusterDashboard,
  BusterDashboardListItem,
  BusterDashboardResponse
} from '@/api/asset_interfaces';
import { DashboardListFilters } from '@/context/Dashboards/DashboardListProvider/interfaces';

const dashboardGetList = (filters: DashboardListFilters) =>
  queryOptions<BusterDashboardListItem[]>({
    queryKey: ['dashboard', 'list', filters] as const,
    staleTime: 10 * 1000
  });

const dashboardGetDashboard = (dashboardId: string) =>
  queryOptions<BusterDashboardResponse>({
    queryKey: ['dashboard', 'get', dashboardId] as const,
    staleTime: 10 * 1000
  });

export const dashboardQueryKeys = {
  '/dashboards/get:getDashboardState': dashboardGetDashboard,
  '/dashboards/list:getDashboardsList': dashboardGetList
};
