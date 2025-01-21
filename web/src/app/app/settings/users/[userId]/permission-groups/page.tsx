import { prefetchGetUserPermissionGroups } from '@/api/buster-rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { UserPermissionGroupsController } from './UserPermissionGroupsController';

export default async function Page({ params }: { params: { userId: string } }) {
  const queryClient = await prefetchGetUserPermissionGroups(params.userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserPermissionGroupsController userId={params.userId} />
    </HydrationBoundary>
  );
}
