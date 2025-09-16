import { useLocation, useMatchRoute, useRouter } from '@tanstack/react-router';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { useGetUser } from '@/api/buster_rest/users';
import { useIsUserAdmin } from '@/api/buster_rest/users/useGetUserInfo';
import { UserHeader } from './UserHeader';
import { UserSegments, UserSegmentsApps } from './UserSegments';

export const LayoutHeaderAndSegment = React.memo(
  ({ children, userId }: { children: React.ReactNode; userId: string }) => {
    const { data: user } = useGetUser({ userId });
    const isAdmin = useIsUserAdmin();
    const [selectedApp, setSelectedApp] = useState<UserSegmentsApps>(UserSegmentsApps.OVERVIEW);

    const initialSelectedApp = useRouteToSegments();

    useLayoutEffect(() => {
      if (initialSelectedApp) {
        setSelectedApp(initialSelectedApp);
      }
    }, []);

    if (!user) return null;

    return (
      <div className="flex flex-col space-y-5">
        <UserHeader user={user} />
        <UserSegments
          userId={userId}
          isAdmin={isAdmin}
          selectedApp={selectedApp}
          onSelectApp={setSelectedApp}
        />
        {children}
      </div>
    );
  }
);

LayoutHeaderAndSegment.displayName = 'LayoutHeaderAndSegment';

const useRouteToSegments = (): UserSegmentsApps => {
  const match = useMatchRoute();

  return useMemo(() => {
    const isPermissionGroups = match({
      from: '/app/settings/users/$userId/permission-groups',
    });
    if (isPermissionGroups) {
      return UserSegmentsApps.PERMISSION_GROUPS;
    }
    const isDatasetGroups = match({
      from: '/app/settings/users/$userId/dataset-groups',
    });
    if (isDatasetGroups) {
      return UserSegmentsApps.DATASET_GROUPS;
    }
    const isDatasets = match({
      from: '/app/settings/users/$userId/datasets',
    });
    if (isDatasets) {
      return UserSegmentsApps.DATASETS;
    }
    // const isTeams = match({
    //   from: '/app/settings/users/$userId/teams',
    // });
    // if (isTeams) {
    //   return UserSegmentsApps.TEAMS;
    // }

    return UserSegmentsApps.OVERVIEW;
  }, []);
};
