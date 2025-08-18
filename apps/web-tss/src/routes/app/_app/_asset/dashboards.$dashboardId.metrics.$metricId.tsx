import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/_asset/dashboards/$dashboardId/metrics/$metricId')({
  loader: async ({ params, context }) => {
    const title = await context.getAssetTitle({
      assetId: params.metricId,
      assetType: 'metric',
    });
    return { title };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Dashboard Metric' },
      { name: 'description', content: 'View metric within dashboard context' },
      { name: 'og:title', content: 'Dashboard Metric' },
      { name: 'og:description', content: 'View metric within dashboard context' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/_app/dashboards/$dashboardId/metrics/$metricId"!</div>;
}
