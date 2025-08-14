import type { GetApprovedDomainsResponse } from '@buster/server-shared/security';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { securityQueryKeys } from '@/api/query_keys/security';
import {
  addApprovedDomain,
  getApprovedDomains,
  getInviteLink,
  getWorkspaceSettings,
  refreshInviteLink,
  removeApprovedDomain,
  updateInviteLinks,
  updateWorkspaceSettings,
} from './requests';

export const useGetWorkspaceSettings = () => {
  return useQuery({
    ...securityQueryKeys.securityGetWorkspaceSettings,
    queryFn: getWorkspaceSettings,
  });
};

export const useGetInviteLink = () => {
  return useQuery({
    ...securityQueryKeys.securityInviteLink,
    queryFn: getInviteLink,
  });
};

export const useGetApprovedDomains = () => {
  return useQuery({
    ...securityQueryKeys.securityApprovedDomains,
    queryFn: getApprovedDomains,
  });
};

export const useUpdateWorkspaceSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWorkspaceSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(securityQueryKeys.securityGetWorkspaceSettings.queryKey, data);
    },
  });
};

export const useUpdateInviteLinks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateInviteLinks,
    onMutate: (variables) => {
      queryClient.setQueryData(securityQueryKeys.securityInviteLink.queryKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...variables,
        };
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(securityQueryKeys.securityInviteLink.queryKey, data);
    },
  });
};

export const useRefreshInviteLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshInviteLink,
    onSuccess: (data) => {
      queryClient.setQueryData(securityQueryKeys.securityInviteLink.queryKey, data);
    },
  });
};

export const useAddApprovedDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addApprovedDomain,
    onMutate: (variables) => {
      queryClient.setQueryData(securityQueryKeys.securityApprovedDomains.queryKey, (prev) => {
        if (!prev) return prev;
        return [
          ...prev,
          ...(variables.domains.map((domain) => ({
            domain,
            created_at: new Date().toISOString(),
          })) satisfies GetApprovedDomainsResponse),
        ] satisfies GetApprovedDomainsResponse;
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(securityQueryKeys.securityApprovedDomains.queryKey, data);
    },
  });
};

export const useRemoveApprovedDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeApprovedDomain,
    onMutate: (variables) => {
      queryClient.setQueryData(securityQueryKeys.securityApprovedDomains.queryKey, (prev) => {
        if (!prev) return prev;
        return prev.filter(
          (domain) => !variables.domains.includes(domain.domain)
        ) satisfies GetApprovedDomainsResponse;
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(securityQueryKeys.securityApprovedDomains.queryKey, data);
    },
  });
};
