import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/_asset/dashboards/$dashboardId')({
  staticData: {
    assetType: 'dashboard',
  },
  loader: async ({ params, context }) => {
    const title = await context.getAssetTitle({
      assetId: params.dashboardId,
      assetType: 'dashboard',
    });
    return {
      title,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Dashboard' },
      { name: 'description', content: 'View and interact with your dashboard' },
      { name: 'og:title', content: 'Dashboard' },
      { name: 'og:description', content: 'View and interact with your dashboard' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { dashboardId } = Route.useParams();
  const { dashboard_version_number } = Route.useSearch();

  return (
    <div>
      <h1>Dashboard: {dashboardId}</h1>
      {dashboard_version_number && <p>Version Number: {dashboard_version_number}</p>}
    </div>
  );
}
