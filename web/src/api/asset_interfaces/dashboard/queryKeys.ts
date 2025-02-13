import { queryOptions } from '@tanstack/react-query';
import type { BusterDashboard, BusterDashboardResponse } from './interfaces';

const dashboardGetList = queryOptions<BusterDashboard[]>({
  queryKey: ['dashboard', 'list'] as const,
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
