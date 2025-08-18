import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  report_version_number: z.coerce.number().optional(),
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute(
  '/app/_app/_asset/chats/$chatId/report/$reportId/metrics/$metricId'
)({
  staticData: {
    assetType: 'metric',
  },
  loader: async ({ params, context }) => {
    const title = await context.getAssetTitle({
      assetId: params.metricId,
      assetType: 'metric',
    });
    return {
      title,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Chat Report Metric' },
      { name: 'description', content: 'View metric within chat report context' },
      { name: 'og:title', content: 'Chat Report Metric' },
      { name: 'og:description', content: 'View metric within chat report context' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/report/$reportId/metrics/$metricId"!</div>;
}
