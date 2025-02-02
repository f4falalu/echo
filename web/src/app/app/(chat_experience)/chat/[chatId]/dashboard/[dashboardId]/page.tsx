import { DashboardIndividualContent } from '@appControllers/DashboardController';
import { AppAssetCheckLayout } from '@appLayouts/AppAssetCheckLayout';

export default function DashboardPage({
  params: { dashboardId }
}: {
  params: { dashboardId: string };
}) {
  return (
    <AppAssetCheckLayout dashboardId={dashboardId} type="dashboard">
      <DashboardIndividualContent />
    </AppAssetCheckLayout>
  );
}
