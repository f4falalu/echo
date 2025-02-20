import { prefetchPermissionGroupDatasetGroups } from '@/api/buster_rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { PermissionGroupDatasetGroupsController } from './_PermissionGroupDatasetGroupsController';

export default async function Page({
  params: { permissionGroupId }
}: {
  params: { permissionGroupId: string };
}) {
  const queryClient = await prefetchPermissionGroupDatasetGroups(permissionGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PermissionGroupDatasetGroupsController permissionGroupId={permissionGroupId} />
    </HydrationBoundary>
  );
}
