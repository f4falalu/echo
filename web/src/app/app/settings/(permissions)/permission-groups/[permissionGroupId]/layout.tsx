import React from 'react';
import { prefetchPermissionGroup } from '@/api/buster_rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { PermissionGroupIndividualLayout } from './_PermissionGroupIndividualLayout';

export default async function Layout({
  children,
  params: { permissionGroupId }
}: {
  children: React.ReactNode;
  params: { permissionGroupId: string };
}) {
  const queryClient = await prefetchPermissionGroup(permissionGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PermissionGroupIndividualLayout permissionGroupId={permissionGroupId}>
        {children}
      </PermissionGroupIndividualLayout>
    </HydrationBoundary>
  );
}
