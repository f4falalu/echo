import { createFileRoute } from '@tanstack/react-router';
import { prefetchListDatasetGroups } from '@/api/buster_rest/dataset_groups';
import { DatasetGroupsListController } from '@/controllers/DatasetGroupsControllers/DatasetGroupsListController';

export const Route = createFileRoute('/app/_settings/_permissions/settings/dataset-groups/')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context;
    await prefetchListDatasetGroups(queryClient);
  },
});

function RouteComponent() {
  return <DatasetGroupsListController />;
}
