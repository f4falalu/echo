import type { User, Organization, OrganizationMember } from '@buster/database';

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
  userId: string,
  organizationId: string,
  role: string = 'querier'
): { organizationId: string; role: string } {
  return {
    organizationId,
    role,
  };
}

export function createMockGetUserOrganizationId() {
  return vi.fn();
}

export function createMockDb() {
  const mockSelect = vi.fn().mockReturnThis();
  const mockFrom = vi.fn().mockReturnThis();
  const mockWhere = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockSet = vi.fn().mockReturnThis();
  const mockReturning = vi.fn();

  return {
    select: mockSelect,
    from: mockFrom,
    where: mockWhere,
    limit: mockLimit,
    update: mockUpdate,
    set: mockSet,
    returning: mockReturning,
    // For chaining
    mockSelect,
    mockFrom,
    mockWhere,
    mockLimit,
    mockUpdate,
    mockSet,
    mockReturning,
  };
}