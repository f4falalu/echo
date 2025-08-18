import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  report_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId/report/$reportId')({
  staticData: {
    assetType: 'report',
  },
  loader: async ({ params, context }) => {
    const title = await context.getAssetTitle({
      assetId: params.reportId,
      assetType: 'report',
    });
    return { title };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Chat Report' },
      { name: 'description', content: 'View report within chat context' },
      { name: 'og:title', content: 'Chat Report' },
      { name: 'og:description', content: 'View report within chat context' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/report/$reportId"!</div>;
}
