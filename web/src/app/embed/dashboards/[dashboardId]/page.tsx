'use client';

import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { CircleSpinnerLoaderContainer } from '@/components/ui/loaders';
import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export default function EmbedDashboardsPage(props: { params: { dashboardId: string } }) {
  const { dashboardId } = props.params;
  const { isFetched: isFetchedDashboard } = useGetDashboard(dashboardId);

  if (!isFetchedDashboard) {
    return <CircleSpinnerLoaderContainer className="min-h-screen" />;
  }

  return <DashboardViewDashboardController dashboardId={dashboardId} readOnly={true} />;
}
