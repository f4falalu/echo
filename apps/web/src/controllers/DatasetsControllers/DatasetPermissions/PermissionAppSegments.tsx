import React, { useMemo, useRef } from 'react';
import {
  useDatasetListDatasetGroups,
  useDatasetListPermissionGroups,
  useDatasetListPermissionUsers,
} from '@/api/buster_rest/datasets';
import { AppSegmented, createSegmentedItems, type SegmentedItem } from '@/components/ui/segmented';
import { PermissionApps } from './config';

export const PermissionAppSegments: React.FC<{
  datasetId: string;
  selectedApp: PermissionApps;
}> = React.memo(({ datasetId, selectedApp }) => {
  const ref = useRef<HTMLDivElement>(null);

  useDatasetListDatasetGroups(datasetId);
  useDatasetListPermissionUsers(datasetId);
  useDatasetListPermissionGroups(datasetId);
  const createPermissionSegmentedItems = createSegmentedItems<PermissionApps>();

  const options: SegmentedItem<PermissionApps>[] = useMemo(
    () =>
      createPermissionSegmentedItems([
        {
          label: 'Overview',
          value: PermissionApps.OVERVIEW,
          link: {
            to: `/app/datasets/$datasetId/permissions/overview`,
            params: {
              datasetId,
            },
          },
        },
        {
          label: 'Permission Groups',
          value: PermissionApps.PERMISSION_GROUPS,
          link: {
            to: `/app/datasets/$datasetId/permissions/permission-groups`,
            params: {
              datasetId,
            },
          },
        },
        {
          label: 'Dataset Groups',
          value: PermissionApps.DATASET_GROUPS,
          link: {
            to: `/app/datasets/$datasetId/permissions/dataset-groups`,
            params: {
              datasetId,
            },
          },
        },
        {
          label: 'Users',
          value: PermissionApps.USERS,
          link: {
            to: `/app/datasets/$datasetId/permissions/users`,
            params: {
              datasetId,
            },
          },
        },
      ]),
    [datasetId]
  );

  return (
    <div ref={ref} className="border-b pb-3">
      <AppSegmented options={options} value={selectedApp} />
    </div>
  );
});

PermissionAppSegments.displayName = 'PermissionAppSegments';
