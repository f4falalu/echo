import React, { useMemo } from 'react';
import { AppSegmented } from '@/components/segmented';
import { useMemoizedFn } from 'ahooks';
import { SegmentedValue } from 'antd/es/segmented';
import { Divider } from 'antd';
import { createBusterRoute, BusterRoutes } from '@/routes';

export enum UserSegmentsApps {
  OVERVIEW = 'Overview',
  DATASET_GROUPS = 'Dataset Groups',
  DATASETS = 'Datasets',
  ATTRIBUTES = 'Attributes',
  TEAMS = 'Teams'
}

export const UserSegments: React.FC<{
  selectedApp: UserSegmentsApps;
  onSelectApp: (app: UserSegmentsApps) => void;
  userId: string;
}> = React.memo(({ selectedApp, onSelectApp, userId }) => {
  const onChange = useMemoizedFn((value: SegmentedValue) => {
    onSelectApp(value as UserSegmentsApps);
  });
  const options = useMemo(
    () => [
      {
        label: 'Overview',
        value: UserSegmentsApps.OVERVIEW,
        link: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_USERS_ID, userId })
      },
      {
        label: 'Dataset Groups',
        value: UserSegmentsApps.DATASET_GROUPS,
        link: createBusterRoute({
          route: BusterRoutes.APP_SETTINGS_USERS_ID_DATASET_GROUPS,
          userId
        })
      },
      {
        label: 'Datasets',
        value: UserSegmentsApps.DATASETS,
        link: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_USERS_ID_DATASETS, userId })
      },
      {
        label: 'Attributes',
        value: UserSegmentsApps.ATTRIBUTES,
        link: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_USERS_ID_ATTRIBUTES, userId })
      },
      {
        label: 'Teams',
        value: UserSegmentsApps.TEAMS,
        link: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_USERS_ID_TEAMS, userId })
      }
    ],
    [userId]
  );

  return (
    <div className="flex flex-col space-y-2">
      <AppSegmented options={options} value={selectedApp} onChange={onChange} />
      <Divider />
    </div>
  );
});

UserSegments.displayName = 'UserSegments';
