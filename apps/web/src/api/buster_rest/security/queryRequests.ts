import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { securityQueryKeys } from '@/api/query_keys/security';
import {
  getWorkspaceSettings,
  getInviteLink,
  getApprovedDomains,
  updateWorkspaceSettings,
  updateInviteLinks,
  refreshInviteLink,
  addApprovedDomain,
  removeApprovedDomain
} from './requests';

export const useGetWorkspaceSettings = () => {
  return useQuery({
    ...securityQueryKeys.securityGetWorkspaceSettings,
    queryFn: getWorkspaceSettings
  });
};

export const useGetInviteLink = () => {
  return useQuery({
    ...securityQueryKeys.securityInviteLink,
    queryFn: getInviteLink
  });
};

export const useGetApprovedDomains = () => {
  return useQuery({
    ...securityQueryKeys.securityApprovedDomains,
    queryFn: getApprovedDomains
  });
};

export const useUpdateWorkspaceSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWorkspaceSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(securityQueryKeys.securityGetWorkspaceSettings.queryKey, data);
    }
  });
};

export const useUpdateInviteLinks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateInviteLinks,
    onSuccess: (data) => {
      queryClient.setQueryData(securityQueryKeys.securityInviteLink.queryKey, data);
    }
  });
};

export const useRefreshInviteLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshInviteLink,
    onSuccess: (data) => {
      queryClient.setQueryData(securityQueryKeys.securityInviteLink.queryKey, data);
    }
  });
};

export const useAddApprovedDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addApprovedDomain,
    onSuccess: (data) => {
      queryClient.setQueryData(securityQueryKeys.securityApprovedDomains.queryKey, data);
    }
  });
};

export const useRemoveApprovedDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeApprovedDomain,
    onSuccess: (data) => {
      queryClient.setQueryData(securityQueryKeys.securityApprovedDomains.queryKey, data);
    }
  });
};
