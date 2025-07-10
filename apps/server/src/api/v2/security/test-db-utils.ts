import { randomUUID } from 'crypto';
import { db, organizations, users, usersToOrganizations } from '@buster/database';
import type { Organization, User } from '@buster/database';
import { and, eq, isNull } from 'drizzle-orm';

export async function createTestUserInDb(userData: Partial<User> = {}): Promise<User> {
  const id = randomUUID();
  const user = {
    id,
    email: `test-${id}@example.com`,
    name: 'Test User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    auth0Id: `auth0|test-${id}`,
    busterEnabled: true,
    ...userData,
  };

  await db.insert(users).values(user);
  return user as User;
}

export async function createTestOrganizationInDb(
  orgData: Partial<Organization> = {}
): Promise<Organization> {
  const id = randomUUID();
  const org = {
    id,
    name: `Test Organization ${id}`,
    domains: [],
    restrictNewUserInvitations: false,
    defaultRole: 'restricted_querier',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    ...orgData,
  };

  await db.insert(organizations).values(org);
  return org as Organization;
}

export async function createTestOrgMemberInDb(
  userId: string,
  organizationId: string,
  role = 'querier'
): Promise<void> {
  const member = {
    userId,
    organizationId,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    createdBy: userId,
    updatedBy: userId,
  };

  await db.insert(usersToOrganizations).values(member);
}

export async function cleanupTestUser(userId: string): Promise<void> {
  // Delete organization memberships
  await db.delete(usersToOrganizations).where(eq(usersToOrganizations.userId, userId));

  // Delete user
  await db.delete(users).where(eq(users.id, userId));
}

export async function cleanupTestOrganization(orgId: string): Promise<void> {
  // Delete organization memberships
  await db.delete(usersToOrganizations).where(eq(usersToOrganizations.organizationId, orgId));

  // Delete organization
  await db.delete(organizations).where(eq(organizations.id, orgId));
}

export async function getOrganizationFromDb(orgId: string): Promise<Organization | null> {
  const result = await db
    .select()
    .from(organizations)
    .where(and(eq(organizations.id, orgId), isNull(organizations.deletedAt)))
    .limit(1);

  return (result[0] as Organization) || null;
}
