import { AppAssetCheckLayout } from '@layouts/AppAssetCheckLayout';

export default function DashboardPage({
  params: { dashboardId }
}: {
  params: { dashboardId: string };
}) {
  return (
    <AppAssetCheckLayout dashboardId={dashboardId} type="dashboard">
      <></>
    </AppAssetCheckLayout>
  );
}
