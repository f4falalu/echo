import { prefetchGetDatasets } from '@/api/buster_rest/datasets';
import { DatasetsPageContent } from './DatasetsPageContent';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function DashboardPage() {
  const queryClient = await prefetchGetDatasets();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DatasetsPageContent />
    </HydrationBoundary>
  );
}
