'use client';

import React, { type PropsWithChildren } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { checkIfUserIsAdmin } from '@/lib/user';
import { useSupabaseContext } from '../Supabase';

export const useUserConfigProvider = () => {
  const isAnonymousUser = useSupabaseContext((state) => state.isAnonymousUser);
  const { data: userResponseData } = useGetMyUserInfo();
  const userResponse = userResponseData;
  const user = userResponse?.user;
  const userTeams = userResponse?.teams || [];
  const userOrganizations = userResponse?.organizations?.[0];
  const userRole = userOrganizations?.role;
  const isUserRegistered =
    !!userResponse &&
    !!userResponse?.organizations?.[0]?.id &&
    !!userResponse?.user?.name &&
    !isAnonymousUser;

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

const BusterUserConfig = createContext<ReturnType<typeof useUserConfigProvider> | undefined>(
  undefined
);

export const BusterUserConfigProvider = React.memo<PropsWithChildren>(({ children }) => {
  const userConfig = useUserConfigProvider();

  return <BusterUserConfig.Provider value={userConfig}>{children}</BusterUserConfig.Provider>;
});
BusterUserConfigProvider.displayName = 'BusterUserConfigProvider';

// Higher-order function to create a selector with error checking
const createSafeSelector = <T,>(
  selector: (state: ReturnType<typeof useUserConfigProvider>) => T
) => {
  return (state: ReturnType<typeof useUserConfigProvider> | undefined) => {
    if (state === undefined) {
      throw new Error(
        'useUserConfigContextSelector must be used within a BusterUserConfigProvider'
      );
    }
    return selector(state);
  };
};

export const useUserConfigContextSelector = <T,>(
  selector: (state: ReturnType<typeof useUserConfigProvider>) => T
) => {
  const safeSelector = createSafeSelector(selector);
  return useContextSelector(BusterUserConfig, safeSelector);
};
