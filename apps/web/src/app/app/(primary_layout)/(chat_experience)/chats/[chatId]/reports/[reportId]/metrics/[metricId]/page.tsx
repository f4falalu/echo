import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';

export default async function Page(props: {
  params: Promise<{ chatId: string; metricId: string; reportId: string }>;
}) {
  const params = await props.params;
  const { chatId, metricId, reportId } = params;

  return redirect(
    createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_REPORT_ID_METRIC_ID_CHART,
      chatId,
      metricId,
      reportId
    })
  );
}
