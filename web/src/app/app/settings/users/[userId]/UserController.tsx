'use client';

import React, { useState } from 'react';
import { useGetUser } from '@/api/buster-rest';
import { UserHeader } from './UserHeader';
import { UserSegments, UserSegmentsApps } from './UserSegments';
import { UserDefaultAccess } from './UserDefaultAccess';
import { useUserConfigContextSelector } from '@/context/Users';
import { UserLineageHeader } from './UserLineageHeader';
import { UserDatasetSearch } from './UserDatasetSearch';

export const UserController = React.memo(({ userId }: { userId: string }) => {
  const { data: user } = useGetUser({ userId });
  const isAdmin = useUserConfigContextSelector((x) => x.isAdmin);
  const [selectedApp, setSelectedApp] = useState<UserSegmentsApps>(UserSegmentsApps.OVERVIEW);

  if (!user) return null;

  return (
    <div className="flex flex-col space-y-5">
      <UserHeader user={user} />
      <UserSegments user={user} selectedApp={selectedApp} onSelectApp={setSelectedApp} />
      <UserDefaultAccess user={user} isAdmin={isAdmin} />
      <UserLineageHeader className="!mt-[48px]" />
      <UserDatasetSearch />
    </div>
  );
});

UserController.displayName = 'UserController';
