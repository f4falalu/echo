import { useGetDashboardParams } from '@/context/Dashboards/useGetDashboardParams';
import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export const component = () => {
  const { dashboardId } = useGetDashboardParams();

  return <div>Dashboard: {dashboardId}</div>;
};
