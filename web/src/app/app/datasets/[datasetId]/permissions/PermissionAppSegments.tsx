'use client';

import React, { useState } from 'react';
import { AppSegmented } from '@/components';
import { PermissionApps } from './config';
import { useMemoizedFn, useSet } from 'ahooks';
import { SegmentedValue } from 'antd/es/segmented';
import { Divider } from 'antd';
import {
  useDatasetListDatasetGroups,
  useDatasetListPermissionGroups,
  useDatasetListPermissionUsers
} from '@/api/busterv2';

export const PermissionAppSegments: React.FC<{
  selectedApp: PermissionApps;
  setSelectedApp: (app: PermissionApps) => void;
  datasetId: string;
}> = React.memo(({ selectedApp, setSelectedApp, datasetId }) => {
  const [prefetchedRoutes, setPrefetchedRoutes] = useSet<string>();

  useDatasetListDatasetGroups(prefetchedRoutes.has(PermissionApps.DATASET_GROUPS) ? datasetId : '');
  useDatasetListPermissionUsers(prefetchedRoutes.has(PermissionApps.USERS) ? datasetId : '');
  useDatasetListPermissionGroups(
    prefetchedRoutes.has(PermissionApps.PERMISSION_GROUPS) ? datasetId : ''
  );

  const handleSelect = useMemoizedFn((app: SegmentedValue) => {
    setSelectedApp(app as PermissionApps);
  });

  const onHoverRoute = useMemoizedFn((route: string) => {
    setPrefetchedRoutes.add(route);
  });

  const options = React.useMemo(
    () =>
      [
        {
          label: 'Overview',
          value: PermissionApps.OVERVIEW
        },
        {
          label: 'Permission Groups',
          value: PermissionApps.PERMISSION_GROUPS
        },
        {
          label: 'Dataset Groups',
          value: PermissionApps.DATASET_GROUPS
        },
        {
          label: 'Users',
          value: PermissionApps.USERS
        }
      ].map((option) => ({
        ...option,
        label: <PrefetchRouteSegmentItem {...option} onHover={onHoverRoute} />
      })),
    []
  );

  return (
    <div className="flex flex-col justify-center space-x-0 space-y-2">
      <AppSegmented options={options} value={selectedApp} onChange={handleSelect} />
      <Divider className="" />
    </div>
  );
});

PermissionAppSegments.displayName = 'PermissionAppSegments';

const PrefetchRouteSegmentItem = React.memo(
  ({
    value,
    label,
    onHover
  }: {
    value: PermissionApps;
    label: string;
    onHover: (route: PermissionApps) => void;
  }) => {
    return (
      <span className="" onMouseEnter={() => onHover(value)}>
        {label}
      </span>
    );
  }
);

PrefetchRouteSegmentItem.displayName = 'PrefetchRouteSegmentItem';
