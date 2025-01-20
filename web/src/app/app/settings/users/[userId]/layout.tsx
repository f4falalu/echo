import React from 'react';
import { UsersBackButton } from './UsersBackButton';
import { prefetchGetUser } from '@/api/buster-rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { userId: string };
}) {
  const queryClient = await prefetchGetUser(params.userId);

  return (
    <div className="flex flex-col space-y-5 px-12 py-12">
      <UsersBackButton />
      <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
    </div>
  );
}
