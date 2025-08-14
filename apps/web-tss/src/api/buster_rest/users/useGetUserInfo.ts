import type { UserResponse } from '@buster/server-shared/user';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { userQueryKeys } from '@/api/query_keys/users';
import {
  type SupabaseContextReturnType,
  useSupabaseContext,
} from '@/context/Supabase/SupabaseContextProvider';
import { checkIfUserIsAdmin } from '@/lib/user';

const stableSelectUserOrganization = (data: UserResponse | null) => {
  const firstOrganization = data?.organizations?.[0];
  return firstOrganization || null;
};

export const useGetUserOrganization = () => {
  const { data } = useQuery({
    ...userQueryKeys.userGetUserMyself,
    select: stableSelectUserOrganization,
    notifyOnChangeProps: ['data'],
  });

  return data;
};

const stableSelectUserOrganizationId = (data: UserResponse | null) => {
  const firstOrganization = data?.organizations?.[0];
  return firstOrganization?.id || null;
};

export const useGetUserOrganizationId = () => {
  const { data } = useQuery({
    ...userQueryKeys.userGetUserMyself,
    select: stableSelectUserOrganizationId,
    notifyOnChangeProps: ['data'],
  });
  return data;
};

export const useIsUserAdmin = () => {
  const userOrganization = useGetUserOrganization();
  const isAdmin = checkIfUserIsAdmin(userOrganization);
  return isAdmin;
};

export const useRestrictNewUserInvitations = () => {
  const userOrganization = useGetUserOrganization();
  const restrictNewUserInvitations = userOrganization?.restrictNewUserInvitations ?? true;
  return restrictNewUserInvitations;
};

const stableSelectUserBasicInfo = (data: UserResponse | null) => {
  return data?.user;
};
export const useGetUserBasicInfo = () => {
  const { data } = useQuery({
    ...userQueryKeys.userGetUserMyself,
    select: stableSelectUserBasicInfo,
    notifyOnChangeProps: ['data'],
  });
  return data;
};

export const useIsAnonymousUser = () => {
  const isAnonymousUser = useSupabaseContext(useCallback((state) => state.isAnonymousUser, []));
  return isAnonymousUser;
};

export const useIsUserRegistered = () => {
  const userOrganization = useGetUserOrganization();
  const userBasicInfo = useGetUserBasicInfo();
  const isAnonymousUser = useIsAnonymousUser();
  const isUserRegistered = !!userOrganization?.id && !!userBasicInfo?.name && !isAnonymousUser;
  return isUserRegistered;
};
