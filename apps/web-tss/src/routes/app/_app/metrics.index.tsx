import { createFileRoute } from '@tanstack/react-router';
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
});
