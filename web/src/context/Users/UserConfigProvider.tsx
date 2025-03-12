'use client';

import type { BusterUserResponse } from '@/api/asset_interfaces/users';
import React, { PropsWithChildren } from 'react';
import { useGetMyUserInfo } from '@/api/buster_rest/users';
import { useSupabaseContext } from '../Supabase';
import { createContext, useContextSelector } from 'use-context-selector';
import { checkIfUserIsAdmin } from '@/lib/user';

export const useUserConfigProvider = ({ userInfo }: { userInfo: BusterUserResponse | null }) => {
  const isAnonymousUser = useSupabaseContext((state) => state.isAnonymousUser);
  const { data: userResponseData } = useGetMyUserInfo();
  const userResponse = userResponseData || userInfo;
  const user = userResponse?.user;
  const userTeams = userResponse?.teams || [];
  const userOrganizations = userResponse?.organizations?.[0];
  const userRole = userOrganizations?.role;
  const isUserRegistered =
    !!userResponse && !!userResponse?.organizations?.[0]?.id && !!userResponse?.user?.name;

  const isAdmin = checkIfUserIsAdmin(userResponse);

  return {
    userTeams,
    user,
    userRole,
    isAdmin,
    userOrganizations,
    isUserRegistered,
    isAnonymousUser
  };
};

const BusterUserConfig = createContext<ReturnType<typeof useUserConfigProvider>>(
  {} as ReturnType<typeof useUserConfigProvider>
);

export const BusterUserConfigProvider = React.memo<
  PropsWithChildren<{ userInfo: BusterUserResponse | undefined }>
>(({ children, userInfo }) => {
  const userConfig = useUserConfigProvider({
    userInfo: userInfo || null
  });

  return <BusterUserConfig.Provider value={userConfig}>{children}</BusterUserConfig.Provider>;
});
BusterUserConfigProvider.displayName = 'BusterUserConfigProvider';

export const useUserConfigContextSelector = <T,>(
  selector: (state: ReturnType<typeof useUserConfigProvider>) => T
) => useContextSelector(BusterUserConfig, selector);
