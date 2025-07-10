import type { User, organizations } from '@buster/database';
import type { InferSelectModel } from 'drizzle-orm';

type Organization = InferSelectModel<typeof organizations>;

export function createTestUser(overrides?: Partial<User>): User {
  const id = `test-user-${Math.random().toString(36).substring(7)}`;
  return {
    id,
    email: `${id}@example.com`,
    name: 'Test User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    auth0Id: `auth0|${id}`,
    busterEnabled: true,
    ...overrides,
  } as User;
}

export function createTestOrganization(overrides?: Partial<Organization>): Organization {
  const id = `test-org-${Math.random().toString(36).substring(7)}`;
  return {
    id,
    name: `Test Organization ${id}`,
    domains: [],
    restrictNewUserInvitations: false,
    defaultRole: 'restricted_querier',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    ...overrides,
  } as Organization;
}

export function createTestOrgMember(
  organizationId: string,
  role = 'querier'
): { organizationId: string; role: string } {
  return {
    organizationId,
    role,
  };
}
