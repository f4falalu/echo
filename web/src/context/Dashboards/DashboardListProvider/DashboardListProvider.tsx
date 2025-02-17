import type { DashboardListFilters } from './interfaces';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';

export const useBusterDashboardListByFilter = (filters: DashboardListFilters) => {
  const { data: dashboardsList, isFetched: isFetchedDashboardsList } = useSocketQueryEmitOn(
    {
      route: '/dashboards/list',
      payload: {
        page_token: 0,
        page_size: 3000, //TODO: make a pagination
        ...filters
      }
    },
    '/dashboards/list:getDashboardsList',
    queryKeys['/dashboards/list:getDashboardsList'](filters)
  );

  //ACTIONS

  return {
    list: dashboardsList,
    isFetchedDashboardsList
  };
};
