import type { DashboardsListEmitPayload } from '@/api/buster_socket/dashboards';

export type DashboardListFilters = NonNullable<
  Omit<DashboardsListEmitPayload['payload'], 'page' | 'page_size'>
>;
