import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetUserDatasetGroups } from '@/api/buster_rest/users';
import { UserDatasetGroupsController } from '@/controllers/DatasetGroupsControllers/UserDatasetGroupsControllers';

export const Route = createFileRoute(
  '/app/_settings/_permissions/settings/users/$userId/dataset-groups'
)({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { userId } = params;
    const { queryClient } = context;
    await prefetchGetUserDatasetGroups(userId, queryClient);
  },
});

function RouteComponent() {
  const { userId } = Route.useParams();
  return <UserDatasetGroupsController userId={userId} />;
}
