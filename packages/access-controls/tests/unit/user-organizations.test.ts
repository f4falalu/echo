import { randomUUID } from 'node:crypto';
import * as db from '@buster/database';
import { describe, expect, it, vi } from 'vitest';
import {
  checkEmailDomainForOrganization,
  checkUserInOrganization,
  createUserInOrganization,
  getOrganizationWithDefaults,
  getUserOrganizations,
} from '../../src/user-organizations';

// Mock the database module
vi.mock('@buster/database', () => ({
  getDb: vi.fn(),
  and: vi.fn((...args) => ({ _and: args })),
  eq: vi.fn((a, b) => ({ _eq: [a, b] })),
  isNull: vi.fn((a) => ({ _isNull: a })),
  organizations: {
    id: 'organizations.id',
    domains: 'organizations.domains',
    deletedAt: 'organizations.deletedAt',
    defaultRole: 'organizations.defaultRole',
  },
  users: {
    id: 'users.id',
    email: 'users.email',
  },
  usersToOrganizations: {
    userId: 'usersToOrganizations.userId',
    organizationId: 'usersToOrganizations.organizationId',
    role: 'usersToOrganizations.role',
    status: 'usersToOrganizations.status',
    deletedAt: 'usersToOrganizations.deletedAt',
  },
}));

// Generate test UUIDs
const TEST_USER_ID = randomUUID();
const TEST_ORG_ID = randomUUID();
const TEST_ORG_ID_2 = randomUUID();
const CREATOR_USER_ID = randomUUID();

describe('user-organizations', () => {
  describe('checkUserInOrganization', () => {
    it('should return user organization info when user exists in org', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            userId: TEST_USER_ID,
            organizationId: TEST_ORG_ID,
            role: 'querier',
            status: 'active',
          },
        ]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await checkUserInOrganization(TEST_USER_ID, TEST_ORG_ID);

      expect(result).toEqual({
        userId: TEST_USER_ID,
        organizationId: TEST_ORG_ID,
        role: 'querier',
        status: 'active',
      });

      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });

    it('should return null when user does not exist in org', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await checkUserInOrganization(TEST_USER_ID, TEST_ORG_ID);

      expect(result).toBeNull();
    });

    it('should validate input parameters', async () => {
      await expect(checkUserInOrganization('invalid-uuid', TEST_ORG_ID)).rejects.toThrow();

      await expect(checkUserInOrganization(TEST_USER_ID, 'invalid-uuid')).rejects.toThrow();
    });
  });

  describe('getUserOrganizations', () => {
    it('should return all organizations for a user', async () => {
      const mockOrgs = [
        {
          userId: TEST_USER_ID,
          organizationId: TEST_ORG_ID,
          role: 'querier',
          status: 'active',
        },
        {
          userId: TEST_USER_ID,
          organizationId: TEST_ORG_ID_2,
          role: 'workspace_admin',
          status: 'active',
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockOrgs),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await getUserOrganizations(TEST_USER_ID);

      expect(result).toEqual(mockOrgs);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no organizations', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await getUserOrganizations(TEST_USER_ID);

      expect(result).toEqual([]);
    });
  });

  describe('checkEmailDomainForOrganization', () => {
    it('should return true when email domain matches org domain', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ domains: ['example.com', 'test.com'] }]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await checkEmailDomainForOrganization('user@example.com', TEST_ORG_ID);

      expect(result).toBe(true);
    });

    it('should return true when email domain matches with @ prefix', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ domains: ['@example.com', 'test.com'] }]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await checkEmailDomainForOrganization('user@example.com', TEST_ORG_ID);

      expect(result).toBe(true);
    });

    it('should return false when email domain does not match', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ domains: ['allowed.com', 'permitted.com'] }]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await checkEmailDomainForOrganization('user@notallowed.com', TEST_ORG_ID);

      expect(result).toBe(false);
    });

    it('should return false when org has no domains', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ domains: null }]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await checkEmailDomainForOrganization('user@example.com', TEST_ORG_ID);

      expect(result).toBe(false);
    });

    it('should return false when org does not exist', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await checkEmailDomainForOrganization('user@example.com', TEST_ORG_ID);

      expect(result).toBe(false);
    });

    it('should be case insensitive for domain matching', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ domains: ['EXAMPLE.COM'] }]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await checkEmailDomainForOrganization('user@example.com', TEST_ORG_ID);

      expect(result).toBe(true);
    });
  });

  describe('getOrganizationWithDefaults', () => {
    it('should return organization with defaults', async () => {
      const mockOrg = {
        id: TEST_ORG_ID,
        name: 'Test Org',
        defaultRole: 'restricted_querier',
        domains: ['example.com'],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockOrg]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await getOrganizationWithDefaults(TEST_ORG_ID);

      expect(result).toEqual(mockOrg);
    });

    it('should return null when organization does not exist', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await getOrganizationWithDefaults(TEST_ORG_ID);

      expect(result).toBeNull();
    });
  });

  describe('createUserInOrganization', () => {
    it('should create new user and add to organization', async () => {
      const mockOrg = {
        id: TEST_ORG_ID,
        name: 'Test Org',
        defaultRole: 'restricted_querier',
        domains: ['example.com'],
      };

      const mockUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        name: 'New User',
        config: {},
        attributes: {},
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          // Check if we're querying users or organizations
          const lastCall = mockDb.from.mock.lastCall;
          if (lastCall && lastCall[0] === db.users) return Promise.resolve([]);
          return Promise.resolve([mockOrg]);
        }),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUser]),
        onConflictDoUpdate: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await createUserInOrganization(
        'newuser@example.com',
        'New User',
        TEST_ORG_ID,
        CREATOR_USER_ID
      );

      expect(result.user).toEqual(mockUser);
      expect(result.membership).toEqual({
        userId: 'new-user-123',
        organizationId: TEST_ORG_ID,
        role: 'restricted_querier',
        status: 'active',
      });

      expect(mockDb.insert).toHaveBeenCalledTimes(2); // User and membership
    });

    it('should use existing user if email already exists', async () => {
      const mockOrg = {
        id: TEST_ORG_ID,
        name: 'Test Org',
        defaultRole: 'querier',
        domains: ['example.com'],
      };

      const mockExistingUser = {
        id: 'existing-user-123',
        email: 'existing@example.com',
        name: 'Existing User',
        config: {},
        attributes: {},
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          // Check if we're querying users or organizations
          const lastCall = mockDb.from.mock.lastCall;
          if (lastCall && lastCall[0] === db.users) return Promise.resolve([mockExistingUser]);
          return Promise.resolve([mockOrg]);
        }),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        onConflictDoUpdate: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const result = await createUserInOrganization(
        'existing@example.com',
        'Another Name',
        TEST_ORG_ID,
        CREATOR_USER_ID
      );

      expect(result.user).toEqual(mockExistingUser);
      expect(result.membership.userId).toBe('existing-user-123');

      // Should only insert membership, not user
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });

    it('should throw error if organization does not exist', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      const nonExistentOrgId = randomUUID();

      await expect(
        createUserInOrganization('user@example.com', 'User', nonExistentOrgId, CREATOR_USER_ID)
      ).rejects.toThrow(`Organization ${nonExistentOrgId} not found`);
    });

    it('should use email prefix as default name when name not provided', async () => {
      const mockOrg = {
        id: TEST_ORG_ID,
        name: 'Test Org',
        defaultRole: 'restricted_querier',
        domains: ['example.com'],
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          // Check if we're querying users or organizations
          const lastCall = mockDb.from.mock.lastCall;
          if (lastCall && lastCall[0] === db.users) return Promise.resolve([]);
          return Promise.resolve([mockOrg]);
        }),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 'new-user-123',
            email: 'john.doe@example.com',
            name: 'john.doe',
            config: {},
            attributes: {},
          },
        ]),
        onConflictDoUpdate: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockReturnValue(mockDb as any);

      await createUserInOrganization(
        'john.doe@example.com',
        undefined,
        TEST_ORG_ID,
        CREATOR_USER_ID
      );

      expect(mockDb.insert).toHaveBeenCalled();
      // Find the user insert call (first insert is for users)
      const insertCalls = mockDb.insert.mock.calls;
      expect(insertCalls.length).toBeGreaterThan(0);

      // Check the values call that corresponds to the user insert
      const valuesCalls = mockDb.values.mock.calls;
      expect(valuesCalls.length).toBeGreaterThan(0);

      // The first values call should be for the user
      const userInsertData = valuesCalls[0][0];
      expect(userInsertData.name).toBe('john.doe');
    });
  });
});
