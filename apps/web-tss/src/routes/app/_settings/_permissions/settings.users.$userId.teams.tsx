import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetUserTeams } from '@/api/buster_rest/users';
import { UserTeamsController } from '@/controllers/TeamsControllers/UserTeamsController';

export const Route = createFileRoute('/app/_settings/_permissions/settings/users/$userId/teams')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { userId } = params;
    const { queryClient } = context;
    await prefetchGetUserTeams(userId, queryClient);
  },
});

function RouteComponent() {
  const { userId } = Route.useParams();
  return <UserTeamsController userId={userId} />;
}
