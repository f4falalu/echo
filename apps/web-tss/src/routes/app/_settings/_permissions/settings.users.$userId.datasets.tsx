import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetUserDatasets } from '@/api/buster_rest/users';
import { UserDatasetsController } from '@/controllers/PermissionDatasetsController/UserDatasetController';

export const Route = createFileRoute('/app/_settings/_permissions/settings/users/$userId/datasets')(
  {
    component: RouteComponent,
    loader: async ({ context, params }) => {
      const { userId } = params;
      const { queryClient } = context;
      await prefetchGetUserDatasets(userId, queryClient);
    },
  }
);

function RouteComponent() {
  const { userId } = Route.useParams();
  return <UserDatasetsController userId={userId} />;
}
