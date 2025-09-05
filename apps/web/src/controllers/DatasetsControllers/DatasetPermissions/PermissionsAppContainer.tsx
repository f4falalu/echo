import { useMatchRoute } from '@tanstack/react-router';
import type React from 'react';
import { PermissionApps } from './config';
import { PermissionAppSegments } from './PermissionAppSegments';

export const PermissionsAppContainer: React.FC<{
  children: React.ReactNode;
  datasetId: string;
}> = ({ children, datasetId }) => {
  const selectedApp = useSelectedApp();

  return (
    <>
      <PermissionAppSegments selectedApp={selectedApp} datasetId={datasetId as string} />

      {children}
    </>
  );
};

PermissionsAppContainer.displayName = 'PermissionsAppContainer';

const useSelectedApp = (): PermissionApps => {
  const match = useMatchRoute();
  if (match({ from: '/app/datasets/$datasetId/permissions' })) {
    return PermissionApps.OVERVIEW;
  }
  if (match({ from: '/app/datasets/$datasetId/permissions/users' })) {
    return PermissionApps.USERS;
  }
  if (match({ from: '/app/datasets/$datasetId/permissions/dataset-groups' })) {
    return PermissionApps.DATASET_GROUPS;
  }
  if (match({ from: '/app/datasets/$datasetId/permissions/permission-groups' })) {
    return PermissionApps.PERMISSION_GROUPS;
  }
  return PermissionApps.OVERVIEW;
};
