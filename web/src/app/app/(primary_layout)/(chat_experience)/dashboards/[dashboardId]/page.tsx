import { DashboardController } from '@controllers/DashboardController';
import { AppAssetCheckLayout } from '@layouts/AppAssetCheckLayout';

export default function Page({ params: { dashboardId } }: { params: { dashboardId: string } }) {
  return (
    <AppAssetCheckLayout dashboardId={dashboardId} type="dashboard">
      <DashboardController dashboardId={dashboardId} />
    </AppAssetCheckLayout>
  );
}
