'use server';

import { useSupabaseServerContext } from '@/context/Supabase/useSupabaseContext';
import React from 'react';
import { getAppSplitterLayout } from '@/components/ui/layouts/AppSplitter';
import { useBusterSupabaseAuthMethods } from '@/hooks/useBusterSupabaseAuthMethods';
import { createBusterRoute } from '@/routes';
import { BusterAppRoutes } from '@/routes/busterRoutes/busterAppRoutes';
import { headers, cookies } from 'next/headers';
import { ClientRedirect } from '../../components/ui/layouts/ClientRedirect';
import { LayoutClient } from './layoutClient';
import { prefetchGetMyUserInfo } from '@/api/buster_rest';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = headers();
  const supabaseContext = await useSupabaseServerContext();
  const { accessToken } = supabaseContext;
  const { initialData: userInfo, queryClient } = await prefetchGetMyUserInfo({
    jwtToken: accessToken
  });

  // const { signOut } = useBusterSupabaseAuthMethods();
  const pathname = headersList.get('x-next-pathname') as string;
  const cookiePathname = cookies().get('x-next-pathname')?.value;
  const newUserRoute = createBusterRoute({ route: BusterAppRoutes.NEW_USER });

  if (
    (!userInfo?.organizations?.[0]?.id || !userInfo?.user?.name) &&
    !cookiePathname?.includes(newUserRoute) &&
    pathname !== newUserRoute &&
    !!accessToken //added to avoid bug with anon user
  ) {
    return <ClientRedirect to={newUserRoute} />;
  }

  return (
    <LayoutClient userInfo={userInfo} supabaseContext={supabaseContext}>
      <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
    </LayoutClient>
  );
}
