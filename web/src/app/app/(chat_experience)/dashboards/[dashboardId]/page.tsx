import { DashboardController } from '@appControllers/DashboardController';
import { AppAssetCheckLayout } from '@/app/app/_layouts/AppAssetCheckLayout';

export default function Page({ params: { dashboardId } }: { params: { dashboardId: string } }) {
  return (
    // <AppAssetCheckLayout dashboardId={dashboardId} type="dashboard">
    <DashboardController dashboardId={dashboardId} />
    // </AppAssetCheckLayout>
  );
}
