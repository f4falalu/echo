import { createFileRoute } from '@tanstack/react-router';
import { Text } from '@/components/ui/typography/Text';
import { ReportsListController } from '@/controllers/ReportsListController';
import { AppPageLayout } from '../components/ui/layouts/AppPageLayout';

export const Route = createFileRoute('/app/_app/reports/')({
  head: () => ({
    meta: [
      { title: 'Reports' },
      { name: 'description', content: 'Generate and view your reports' },
      { name: 'og:title', content: 'Reports' },
      { name: 'og:description', content: 'Generate and view your reports' },
    ],
  }),
  component: () => (
    <AppPageLayout headerSizeVariant="list" header={<Text>Reports</Text>}>
      <ReportsListController />
    </AppPageLayout>
  ),
});
