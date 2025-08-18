import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetDatasetMetadata } from '@/api/buster_rest/datasets/queryRequests';

export const Route = createFileRoute('/app/_app/datasets/$datasetId')({
  loader: async ({ params, context }) => {
    const queryClient = context.queryClient;
    const { dataset } = await prefetchGetDatasetMetadata(params.datasetId, queryClient);
    return {
      dataset,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.dataset?.name || 'Dataset' },
      { name: 'description', content: 'Explore and analyze your dataset' },
      { name: 'og:title', content: 'Dataset' },
      { name: 'og:description', content: 'Explore and analyze your dataset' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/datasets/$datasetId"!</div>;
}
