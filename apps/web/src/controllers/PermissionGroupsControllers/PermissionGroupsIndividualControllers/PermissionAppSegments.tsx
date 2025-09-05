import { useMatchRoute } from '@tanstack/react-router';
import type React from 'react';
import { AppSegmented } from '@/components/ui/segmented';
import { Separator } from '@/components/ui/separator';

export enum PermissionSegmentsApps {
  USERS = 'users',
  DATASET_GROUPS = 'dataset-groups',
  DATASETS = 'datasets',
}

export const PermissionAppSegments: React.FC<{
  permissionGroupId: string;
}> = ({ permissionGroupId }) => {
  const value = useRouteToSegments();

  return (
    <div className="flex flex-col space-y-2">
      <AppSegmented
        type="button"
        value={value}
        options={[
          {
            label: 'Users',
            value: PermissionSegmentsApps.USERS,
            link: {
              to: '/app/settings/permission-groups/$permissionGroupId/users',
              params: {
                permissionGroupId,
              },
            },
          },
          {
            label: 'Dataset groups',
            value: PermissionSegmentsApps.DATASET_GROUPS,
            link: {
              to: '/app/settings/permission-groups/$permissionGroupId/dataset-groups',
              params: {
                permissionGroupId,
              },
            },
          },
          {
            label: 'Datasets',
            value: PermissionSegmentsApps.DATASETS,
            link: {
              to: '/app/settings/permission-groups/$permissionGroupId/datasets',
              params: {
                permissionGroupId,
              },
            },
          },
        ]}
      />
      <Separator />
    </div>
  );
};

const useRouteToSegments = (): PermissionSegmentsApps => {
  const match = useMatchRoute();
  if (
    match({
      from: '/app/settings/permission-groups/$permissionGroupId/users',
    })
  ) {
    return PermissionSegmentsApps.USERS;
  }

  if (
    match({
      from: '/app/settings/permission-groups/$permissionGroupId/dataset-groups',
    })
  ) {
    return PermissionSegmentsApps.DATASET_GROUPS;
  }

  return PermissionSegmentsApps.DATASETS;
};
