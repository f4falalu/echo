'use client';

import React, { useState } from 'react';
import { UserHeader } from './UserHeader';
import { UserSegments, UserSegmentsApps } from './UserSegments';
import { useGetUser } from '@/api/buster-rest';

export const LayoutHeaderAndSegment = React.memo(
  ({ children, userId }: { children: React.ReactNode; userId: string }) => {
    const { data: user } = useGetUser({ userId });
    const [selectedApp, setSelectedApp] = useState<UserSegmentsApps>(UserSegmentsApps.OVERVIEW);

    if (!user) return null;

    return (
      <div className="flex flex-col space-y-5">
        <UserHeader user={user} />
        <UserSegments userId={userId} selectedApp={selectedApp} onSelectApp={setSelectedApp} />
        {children}
      </div>
    );
  }
);

LayoutHeaderAndSegment.displayName = 'LayoutHeaderAndSegment';
