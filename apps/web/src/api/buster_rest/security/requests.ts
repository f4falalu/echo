import { mainApiV2 } from '../instances';
import {
  type UpdateInviteLinkRequest,
  type AddApprovedDomainRequest,
  type RemoveApprovedDomainRequest,
  type UpdateWorkspaceSettingsRequest,
  type GetApprovedDomainsResponse,
  type GetInviteLinkResponse,
  type RefreshInviteLinkResponse,
  type UpdateInviteLinkResponse,
  type AddApprovedDomainsResponse,
  type GetWorkspaceSettingsResponse,
  type UpdateWorkspaceSettingsResponse
} from '@buster/server-shared/security';

export const updateInviteLinks = async (request: UpdateInviteLinkRequest) => {
  return await mainApiV2
    .post<UpdateInviteLinkResponse>('/security/invite-links', request)
    .then((res) => res.data);
};

export const refreshInviteLink = async () => {
  return await mainApiV2
    .post<RefreshInviteLinkResponse>('/security/invite-links/refresh')
    .then((res) => res.data);
};

export const getInviteLink = async () => {
  return await mainApiV2
    .get<GetInviteLinkResponse>('/security/invite-links')
    .then((res) => res.data);
};

export const getApprovedDomains = async () => {
  return await mainApiV2
    .get<GetApprovedDomainsResponse>('/security/approved-domains')
    .then((res) => res.data);
};

export const addApprovedDomain = async (request: AddApprovedDomainRequest) => {
  return await mainApiV2
    .post<AddApprovedDomainsResponse>('/security/approved-domains', request)
    .then((res) => res.data);
};

export const removeApprovedDomain = async (request: RemoveApprovedDomainRequest) => {
  return await mainApiV2
    .delete<GetApprovedDomainsResponse>('/security/approved-domains', {
      data: request
    })
    .then((res) => res.data);
};

export const getWorkspaceSettings = async () => {
  return await mainApiV2
    .get<GetWorkspaceSettingsResponse>('/security/settings')
    .then((res) => res.data);
};

export const updateWorkspaceSettings = async (request: UpdateWorkspaceSettingsRequest) => {
  return await mainApiV2
    .put<UpdateWorkspaceSettingsResponse>('/security/settings', request)
    .then((res) => res.data);
};
