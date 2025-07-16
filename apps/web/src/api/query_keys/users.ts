import { queryOptions } from '@tanstack/react-query';
import type {
  BusterUserAttribute,
  BusterUserDataset,
  BusterUserDatasetGroup,
  BusterUserPermissionGroup,
  BusterUserTeamListItem
} from '@/api/asset_interfaces/users';
import type { OrganizationUser } from '@buster/server-shared/organization';
import type {
  GetUserToOrganizationRequest,
  GetUserToOrganizationResponse,
  UserFavoriteResponse,
  UserResponse
} from '@buster/server-shared/user';

const favoritesGetList = queryOptions<UserFavoriteResponse>({
  queryKey: ['myself', 'list', 'favorites'] as const,
  staleTime: 1000 * 60 * 60, // 1 hour,
  initialData: [],
  initialDataUpdatedAt: 0
});

const userGetUserMyself = queryOptions<UserResponse | null>({
  queryKey: ['myself'] as const,
  staleTime: 1000 * 60 * 60 // 1 hour
});

const userGetUser = (userId: string) =>
  queryOptions<OrganizationUser>({
    queryKey: ['users', userId, 'organization'] as const
  });

const userGetUserPermissionsGroups = (userId: string) =>
  queryOptions<BusterUserPermissionGroup[]>({
    queryKey: ['users', userId, 'permissionsGroups'] as const
  });

const userGetUserTeams = (userId: string) =>
  queryOptions<BusterUserTeamListItem[]>({
    queryKey: ['users', userId, 'teams'] as const
  });

const userGetUserAttributes = (userId: string) =>
  queryOptions<BusterUserAttribute[]>({
    queryKey: ['users', userId, 'attributes'] as const
  });

const userGetUserDatasets = (userId: string) =>
  queryOptions<BusterUserDataset[]>({
    queryKey: ['users', userId, 'datasets'] as const
  });

const userGetUserDatasetGroups = (userId: string) =>
  queryOptions<BusterUserDatasetGroup[]>({
    queryKey: ['users', userId, 'datasetGroups'] as const
  });

const userGetUserToOrganization = (params: GetUserToOrganizationRequest) =>
  queryOptions<GetUserToOrganizationResponse>({
    queryKey: ['users', 'organization', params] as const
  });

export const userQueryKeys = {
  favoritesGetList,
  userGetUserMyself,
  userGetUser,
  userGetUserPermissionsGroups,
  userGetUserTeams,
  userGetUserAttributes,
  userGetUserDatasets,
  userGetUserDatasetGroups,
  userGetUserToOrganization
};
