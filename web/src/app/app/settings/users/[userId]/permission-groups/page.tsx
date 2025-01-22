import { getMyUserInfo, prefetchGetUserPermissionGroups } from '@/api/buster-rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { UserPermissionGroupsController } from './UserPermissionGroupsController';
import { useSupabaseServerContext } from '@/context/Supabase/useSupabaseContext';
import { checkIfUserIsAdmin } from '../../../../../../context/Users/helpers';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';

export default async function Page({ params }: { params: { userId: string } }) {
  const supabaseContext = await useSupabaseServerContext();
  const userInfo = await getMyUserInfo({ jwtToken: supabaseContext.accessToken });
  const isAdmin = checkIfUserIsAdmin(userInfo);

  if (!isAdmin) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.APP_SETTINGS_USERS
      })
    );
  }

  const queryClient = await prefetchGetUserPermissionGroups(params.userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserPermissionGroupsController userId={params.userId} />
    </HydrationBoundary>
  );
}
