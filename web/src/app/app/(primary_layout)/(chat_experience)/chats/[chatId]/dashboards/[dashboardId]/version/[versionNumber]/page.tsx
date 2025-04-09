import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController/DashboardViewDashboardController';

export default async function Page({
  params
}: {
  params: Promise<{ versionNumber: string; dashboardId: string; chatId: string }>;
}) {
  const { versionNumber, dashboardId, chatId } = await params;
  return <DashboardViewDashboardController dashboardId={dashboardId} chatId={chatId} readOnly />;
}
