import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetOrganizationUsers } from '@/api/buster_rest/organizations';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users';
import { ListUsersController } from '@/controllers/ListUsersController';

export const Route = createFileRoute('/app/_settings/_permissions/settings/users/')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context;
    const user = await prefetchGetMyUserInfo(queryClient);
    if (user?.organizations) {
      await prefetchGetOrganizationUsers(user.organizations[0]?.id, queryClient);
    }
  },
});

function RouteComponent() {
  return <ListUsersController />;
}
