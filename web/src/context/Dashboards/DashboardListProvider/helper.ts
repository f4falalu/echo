import { BusterDashboardListItem } from '@/api/asset_interfaces';
import { DashboardListFilters } from './interfaces';

export const dashboardsArrayToRecord = (dashboards: BusterDashboardListItem[]) => {
  return dashboards.reduce<Record<string, BusterDashboardListItem>>((acc, dashboard) => {
    acc[dashboard.id] = dashboard;
    return acc;
  }, {});
};

export const createFilterRecord = (params?: DashboardListFilters): string => {
  const sharedWithMeString = params?.shared_with_me ? 'shared_with_me' : '';
  const onlyMyDashboardsString = params?.only_my_dashboards ? 'only_my_dashboards' : '';
  return sharedWithMeString + onlyMyDashboardsString;
};
