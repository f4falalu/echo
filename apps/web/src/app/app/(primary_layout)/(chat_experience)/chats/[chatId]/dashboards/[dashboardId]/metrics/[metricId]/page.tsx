import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';

export default async function Page(props: {
  params: Promise<{ chatId: string; metricId: string; dashboardId: string }>;
}) {
  const params = await props.params;
  const { chatId, metricId, dashboardId } = params;

  return redirect(
    createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID_CHART,
      chatId,
      metricId,
      dashboardId
    })
  );
}
