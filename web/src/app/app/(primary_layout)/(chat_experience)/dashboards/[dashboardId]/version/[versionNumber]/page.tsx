import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export default async function DashboardVersionPage({
  params
}: {
  params: Promise<{ versionNumber: string; dashboardId: string }>;
}) {
  const { versionNumber, dashboardId } = await params;
  return <DashboardViewDashboardController dashboardId={dashboardId} chatId={undefined} readOnly />;
}
