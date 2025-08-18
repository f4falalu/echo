import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  report_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/_asset/reports/$reportId/')({
  loader: async ({ params, context }) => {
    const title = await context.getAssetTitle({
      assetId: params.reportId,
      assetType: 'report',
    });
    return {
      title,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Report' },
      { name: 'description', content: 'View detailed report data and analysis' },
      { name: 'og:title', content: 'Report' },
      { name: 'og:description', content: 'View detailed report data and analysis' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/reports/$reportId"!</div>;
}
