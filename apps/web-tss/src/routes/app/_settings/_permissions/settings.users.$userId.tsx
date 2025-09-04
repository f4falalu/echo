import { createFileRoute, Outlet } from '@tanstack/react-router';
import { prefetchGetUser } from '@/api/buster_rest/users';
import { UserIndividualsLayout } from '@/controllers/UserIndividualControllers/UserIndividualsLayout';

export const Route = createFileRoute('/app/_settings/_permissions/settings/users/$userId')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { userId } = params;
    const user = await prefetchGetUser(userId, context.queryClient);
    return {
      name: user?.name,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.name || 'User' },
      { name: 'description', content: `View and manage user ${loaderData?.name}` },
      { name: 'og:title', content: loaderData?.name || 'User' },
      { name: 'og:description', content: `View and manage user ${loaderData?.name}` },
    ],
  }),
});

function RouteComponent() {
  const { userId } = Route.useParams();
  return (
    <UserIndividualsLayout userId={userId}>
      <Outlet />
    </UserIndividualsLayout>
  );
}
