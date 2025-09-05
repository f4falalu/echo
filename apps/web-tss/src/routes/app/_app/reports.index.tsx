import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetReportsList } from '@/api/buster_rest/reports';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { Text } from '@/components/ui/typography/Text';
import { ReportsListController } from '@/controllers/ReportsListController';

export const Route = createFileRoute('/app/_app/reports/')({
  head: () => ({
    meta: [
      { title: 'Reports' },
      { name: 'description', content: 'Generate and view your reports' },
      { name: 'og:title', content: 'Reports' },
      { name: 'og:description', content: 'Generate and view your reports' },
    ],
  }),
  loader: async ({ context }) => {
    prefetchGetReportsList(context.queryClient); //do not wait
  },
  component: () => (
    <AppPageLayout headerSizeVariant="list" header={<Text>Reports</Text>}>
      <ReportsListController />
    </AppPageLayout>
  ),
});
