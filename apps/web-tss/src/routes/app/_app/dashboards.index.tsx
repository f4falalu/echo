import { createFileRoute } from '@tanstack/react-router';
import { DashboardListController } from '@/controllers/DashboardListController';

export const Route = createFileRoute('/app/_app/dashboards/')({
  head: () => ({
    meta: [
      { title: 'Dashboards' },
      { name: 'description', content: 'View and manage your data dashboards' },
      { name: 'og:title', content: 'Dashboards' },
      { name: 'og:description', content: 'View and manage your data dashboards' },
    ],
  }),
  component: DashboardListController,
});
