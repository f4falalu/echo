import type {
  GetWorkspaceSettingsResponse,
  GetApprovedDomainsResponse,
  GetInviteLinkResponse
} from '@buster/server-shared/security';
import { queryOptions } from '@tanstack/react-query';

export const securityGetWorkspaceSettings = queryOptions<GetWorkspaceSettingsResponse>({
  queryKey: ['security', 'workspace-settings']
});

export const securityApprovedDomains = queryOptions<GetApprovedDomainsResponse>({
  queryKey: ['security', 'approved-domains']
});

export const securityInviteLink = queryOptions<GetInviteLinkResponse>({
  queryKey: ['security', 'invite-link']
});

export const securityQueryKeys = {
  securityGetWorkspaceSettings,
  securityApprovedDomains,
  securityInviteLink
};
