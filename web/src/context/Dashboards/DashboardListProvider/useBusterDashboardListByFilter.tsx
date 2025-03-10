import { useGetDashboardsList } from '@/api/buster_rest/dashboards';
import { DashboardsListRequest } from '@/api/request_interfaces/dashboards/interfaces';

export const useBusterDashboardListByFilter = (
  filters: Omit<DashboardsListRequest, 'page_token' | 'page_size'>
) => {
  const { data: dashboardsList, isFetched: isFetchedDashboardsList } = useGetDashboardsList({
    ...filters,
    page_token: 0,
    page_size: 3000
  });

  return {
    list: dashboardsList,
    isFetchedDashboardsList
  };
};
