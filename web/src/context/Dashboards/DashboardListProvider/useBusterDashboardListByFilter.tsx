import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
import { DashboardsListRequest } from '@/api/request_interfaces/dashboards/interfaces';

export const useBusterDashboardListByFilter = (
  filters: Omit<DashboardsListRequest, 'page_token' | 'page_size'>
) => {
  const { data: dashboardsList, isFetched: isFetchedDashboardsList } = useSocketQueryEmitOn({
    emitEvent: {
      route: '/dashboards/list',
      payload: {
        page_token: 0,
        page_size: 3000, //TODO: make a pagination
        ...filters
      }
    },
    responseEvent: '/dashboards/list:getDashboardsList',
    options: queryKeys.dashboardGetList(filters)
  });

  //ACTIONS

  return {
    list: dashboardsList,
    isFetchedDashboardsList
  };
};
