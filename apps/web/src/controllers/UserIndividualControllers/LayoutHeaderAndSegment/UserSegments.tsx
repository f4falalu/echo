import { Link, type LinkProps } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import type { SegmentedItem } from '@/components/ui/segmented';
import { AppSegmented, createSegmentedItem, createSegmentedItems } from '@/components/ui/segmented';
import { Separator } from '@/components/ui/separator';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { defineLink } from '@/lib/routes';
import type { ILinkProps } from '@/types/routes';

export enum UserSegmentsApps {
  OVERVIEW = 'Overview',
  PERMISSION_GROUPS = 'Permission Groups',
  DATASET_GROUPS = 'Dataset Groups',
  DATASETS = 'Datasets',
  ATTRIBUTES = 'Attributes',
  //TEAMS = 'Teams',
}

export const UserSegments: React.FC<{
  isAdmin: boolean;
  selectedApp: UserSegmentsApps;
  onSelectApp: (app: UserSegmentsApps) => void;
  userId: string;
}> = React.memo(({ selectedApp, onSelectApp, userId }) => {
  const onChange = useMemoizedFn((value: SegmentedItem<UserSegmentsApps>) => {
    onSelectApp(value.value);
  });
  const createUserSegmentedItems = createSegmentedItems<UserSegmentsApps>();

  const options = useMemo(
    () =>
      createUserSegmentedItems([
        {
          label: 'Overview',
          value: UserSegmentsApps.OVERVIEW,
          link: {
            to: `/app/settings/users/$userId`,
            params: {
              userId,
            },
          },
        },
        {
          label: 'Permissions groups',
          value: UserSegmentsApps.PERMISSION_GROUPS,
          link: {
            to: `/app/settings/users/$userId/permission-groups`,
            params: {
              userId,
            },
          },
        },
        {
          label: 'Dataset groups',
          value: UserSegmentsApps.DATASET_GROUPS,
          link: {
            to: `/app/settings/users/$userId/dataset-groups`,
            params: {
              userId,
            },
          },
        },
        {
          label: 'Datasets',
          value: UserSegmentsApps.DATASETS,
          link: {
            to: `/app/settings/users/$userId/datasets`,
            params: {
              userId,
            },
          },
        },
        // {
        //   label: 'Attributes',
        //   value: UserSegmentsApps.ATTRIBUTES,
        //   link: {
        //     to: `/app/settings/users/$userId/attributes`,
        //     params: {
        //       userId,
        //     },
        //   },
        // },
        // {
        //   label: 'Teams',
        //   value: UserSegmentsApps.TEAMS,
        //   link: {
        //     to: `/app/settings/users/$userId/teams`,
        //     params: {
        //       userId,
        //     },
        //   },
        // },
      ]),
    [userId]
  );

  return (
    <div className="flex flex-col space-y-2">
      <AppSegmented type="button" options={options} value={selectedApp} onChange={onChange} />
      <Separator />
    </div>
  );
});

UserSegments.displayName = 'UserSegments';
