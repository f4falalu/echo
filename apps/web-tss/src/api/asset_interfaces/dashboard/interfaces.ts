import type { DashboardListItem, GetDashboardResponse } from '@buster/server-shared/dashboards';

export type BusterDashboardListItem = DashboardListItem;

export type BusterDashboardResponse = GetDashboardResponse;

export type BusterDashboard = GetDashboardResponse['dashboard'];
