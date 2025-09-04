import React from 'react';
import { useGetUser } from '@/api/buster_rest/users';
import { useGetUserBasicInfo, useIsUserAdmin } from '@/api/buster_rest/users/useGetUserInfo';
import { UserDatasetSearch } from './UserDatasetSearch';
import { UserDefaultAccess } from './UserDefaultAccess';
import { UserLineageHeader } from './UserLineageHeader';

export const UserOverviewController = React.memo(({ userId }: { userId: string }) => {
  const { data: user, refetch: refetchUser } = useGetUser({ userId });
  const isAdmin = useIsUserAdmin();
  const myUser = useGetUserBasicInfo();

  if (!user || !myUser) return null;

  return (
    <>
      <UserDefaultAccess user={user} myUser={myUser} isAdmin={isAdmin} refetchUser={refetchUser} />
      <UserLineageHeader className="mt-12!" user={user} />
      <UserDatasetSearch user={user} />
    </>
  );
});

UserOverviewController.displayName = 'UserController';
