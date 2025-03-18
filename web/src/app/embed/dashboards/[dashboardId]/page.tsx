import { DashboardController } from '@/controllers/DashboardController';

export default async function EmbedDashboardsPage(props: {
  params: Promise<{ dashboardId: string }>;
}) {
  const params = await props.params;

  const { dashboardId } = params;

  return <DashboardController dashboardId={dashboardId} />;
}
