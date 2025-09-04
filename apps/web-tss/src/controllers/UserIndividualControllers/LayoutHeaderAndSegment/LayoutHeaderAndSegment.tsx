import React, { useLayoutEffect, useState } from 'react';
import { useGetUser } from '@/api/buster_rest/users';
import { useIsUserAdmin } from '@/api/buster_rest/users/useGetUserInfo';
import { UserHeader } from './UserHeader';
import { SegmentToApp, UserSegments, UserSegmentsApps } from './UserSegments';

export const LayoutHeaderAndSegment = React.memo(
  ({ children, userId }: { children: React.ReactNode; userId: string }) => {
    const { data: user } = useGetUser({ userId });
    const isAdmin = useIsUserAdmin();
    console.warn('TODO: currentRoute');
    //SegmentToApp[currentRoute as keyof typeof SegmentToApp] ||
    const [selectedApp, setSelectedApp] = useState<UserSegmentsApps>(UserSegmentsApps.OVERVIEW);

    useLayoutEffect(() => {
      // if (currentRoute && currentRoute in SegmentToApp) {
      //   setSelectedApp(SegmentToApp[currentRoute as keyof typeof SegmentToApp]);
      // }
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
