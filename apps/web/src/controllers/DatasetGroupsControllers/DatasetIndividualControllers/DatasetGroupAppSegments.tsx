import { useMatchRoute } from '@tanstack/react-router';
import type React from 'react';
import { AppSegmented } from '@/components/ui/segmented';
import { Separator } from '@/components/ui/separator';

export enum PermissionSegmentsApps {
  USERS = 'users',
  PERMISSION_GROUPS = 'permission-groups',
  DATASETS = 'datasets',
}

export const DatasetGroupAppSegments: React.FC<{
  datasetGroupId: string;
}> = ({ datasetGroupId }) => {
  const value = useRouteToSegments();
  return (
    <div className="flex flex-col space-y-2">
      <AppSegmented
        type="button"
        value={value}
        options={[
          {
            label: 'Datasets',
            value: PermissionSegmentsApps.DATASETS,
            link: {
              to: `/app/settings/dataset-groups/$datasetGroupId/datasets`,
              params: {
                datasetGroupId,
              },
            },
          },
          {
            label: 'Users',
            value: PermissionSegmentsApps.USERS,
            link: {
              to: `/app/settings/dataset-groups/$datasetGroupId/users`,
              params: {
                datasetGroupId,
              },
            },
          },
          {
            label: 'Permission groups',
            value: PermissionSegmentsApps.PERMISSION_GROUPS,
            link: {
              to: `/app/settings/dataset-groups/$datasetGroupId/permission-groups`,
              params: {
                datasetGroupId,
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
      from: '/app/settings/dataset-groups/$datasetGroupId/datasets',
    })
  ) {
    return PermissionSegmentsApps.DATASETS;
  }

  if (
    match({
      from: '/app/settings/dataset-groups/$datasetGroupId/users',
    })
  ) {
    return PermissionSegmentsApps.USERS;
  }

  if (
    match({
      from: '/app/settings/dataset-groups/$datasetGroupId/permission-groups',
    })
  ) {
    return PermissionSegmentsApps.PERMISSION_GROUPS;
  }

  return PermissionSegmentsApps.DATASETS;
};
