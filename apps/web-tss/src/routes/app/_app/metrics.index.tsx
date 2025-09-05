import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetMetricsList } from '@/api/buster_rest/metrics';
import { MetricListContainer } from '@/controllers/MetricListContainer';

export const Route = createFileRoute('/app/_app/metrics/')({
  head: () => ({
    meta: [
      { title: 'Metrics' },
      { name: 'description', content: 'View and analyze your metrics' },
      { name: 'og:title', content: 'Metrics' },
      { name: 'og:description', content: 'View and analyze your metrics' },
    ],
  }),
  component: MetricListContainer,
  loader: async ({ context }) => {
    prefetchGetMetricsList(context.queryClient); //do not wait
  },
});
