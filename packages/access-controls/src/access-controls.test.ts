import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create a proper chainable mock
const createChainableMock = () => {
  const mock: any = {};

  const methods = [
    'select',
    'from',
    'where',
    'limit',
    'offset',
    'orderBy',
    'innerJoin',
    'selectDistinct',
  ];

  for (const method of methods) {
    mock[method] = vi.fn().mockReturnValue(mock);
  }

  // Override specific methods that should return data
  mock._resolveWith = (data: any) => {
    mock.limit.mockResolvedValue(data);
    mock.where.mockResolvedValue(data);
    mock.offset.mockResolvedValue(data);
    // Also make sure the chainable methods return promises when needed
    mock.limit.mockReturnValue(Promise.resolve(data));
    mock.where.mockReturnValue(Promise.resolve(data));
    mock.offset.mockReturnValue(Promise.resolve(data));
    return mock;
  };

  return mock;
};

// Mock the database module
vi.mock('@buster/database', () => ({
  getDb: vi.fn(() => createChainableMock()),
  and: vi.fn((...args) => ({ type: 'and', args })),
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  isNull: vi.fn((field) => ({ type: 'isNull', field })),
  inArray: vi.fn((field, array) => ({ type: 'inArray', field, array })),
  count: vi.fn(() => ({ type: 'count' })),
  usersToOrganizations: {},
  datasets: {},
  permissionGroups: {},
  datasetsToPermissionGroups: {},
  datasetPermissions: {},
  permissionGroupsToIdentities: {},
  teamsToUsers: {},
}));

describe('Access Controls Unit Tests - Organization Default Permission Group', () => {
  const testUserId = uuidv4();
  const testOrgId = uuidv4();
  const testDefaultGroupId = uuidv4();
  const testDatasetId1 = uuidv4();
  const testDatasetId2 = uuidv4();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache to ensure fresh imports
    vi.resetModules();
  });

  describe('getPermissionedDatasets', () => {
    it('should validate user ID is a valid UUID', async () => {
      const { getPermissionedDatasets } = await import('./access-controls');

      await expect(getPermissionedDatasets('invalid-uuid', 0, 10)).rejects.toThrow();
    });

    it('should validate pagination parameters', async () => {
      const { getPermissionedDatasets } = await import('./access-controls');

      await expect(getPermissionedDatasets(testUserId, -1, 10)).rejects.toThrow();
      await expect(getPermissionedDatasets(testUserId, 0, 0)).rejects.toThrow();
      await expect(getPermissionedDatasets(testUserId, 0, 1001)).rejects.toThrow();
    });

    it('should return empty array when user has no organization', async () => {
      const mockDb = createChainableMock();

      // Mock for user organization query (returns empty)
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([]);

      vi.mocked(await import('@buster/database')).getDb.mockReturnValue(mockDb);

      const { getPermissionedDatasets } = await import('./access-controls');
      const result = await getPermissionedDatasets(testUserId, 0, 10);

      expect(result).toEqual([]);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return datasets for admin users', async () => {
      const mockDb = createChainableMock();

      // Mock for user organization query - returns admin user
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([
        {
          organizationId: testOrgId,
          role: 'data_admin',
        },
      ]);

      // Mock for datasets query
      const mockDatasets = [
        {
          id: testDatasetId1,
          name: 'Dataset 1',
          ymlFile: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          dataSourceId: uuidv4(),
        },
      ];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockReturnValueOnce(mockDb);
      mockDb.limit.mockReturnValueOnce(mockDb);
      mockDb.offset.mockResolvedValueOnce(mockDatasets);

      vi.mocked(await import('@buster/database')).getDb.mockReturnValue(mockDb);

      const { getPermissionedDatasets } = await import('./access-controls');
      const result = await getPermissionedDatasets(testUserId, 0, 10);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(testDatasetId1);
    });
  });

  describe('hasDatasetAccess', () => {
    it('should validate dataset ID is a valid UUID', async () => {
      const { hasDatasetAccess } = await import('./access-controls');

      await expect(hasDatasetAccess(testUserId, 'invalid-uuid')).rejects.toThrow();
    });

    it('should return false when dataset is deleted', async () => {
      const { getDb } = await import('@buster/database');

      vi.resetModules();
      vi.clearAllMocks();

      const mockDb = createChainableMock();
      vi.mocked(await import('@buster/database')).getDb.mockReturnValue(mockDb);

      const { hasDatasetAccess } = await import('./access-controls');

      // Mock dataset query to return deleted dataset
      mockDb.limit.mockResolvedValueOnce([
        {
          organizationId: testOrgId,
          deletedAt: new Date().toISOString(),
        },
      ]);

      const result = await hasDatasetAccess(testUserId, testDatasetId1);

      expect(result).toBe(false);
    });
  });

  describe('hasAllDatasetsAccess', () => {
    it('should return false for empty dataset array', async () => {
      const { hasAllDatasetsAccess } = await import('./access-controls');

      const result = await hasAllDatasetsAccess(testUserId, []);

      expect(result).toBe(false);
    });

    it('should validate all dataset IDs are valid UUIDs', async () => {
      const { hasAllDatasetsAccess } = await import('./access-controls');

      await expect(
        hasAllDatasetsAccess(testUserId, [testDatasetId1, 'invalid-uuid'])
      ).rejects.toThrow();
    });

    it('should return false when not all datasets exist', async () => {
      const { getDb } = await import('@buster/database');

      vi.resetModules();
      vi.clearAllMocks();

      const mockDb = createChainableMock();
      vi.mocked(await import('@buster/database')).getDb.mockReturnValue(mockDb);

      const { hasAllDatasetsAccess } = await import('./access-controls');

      // Mock dataset query to return fewer datasets than requested
      mockDb.limit.mockResolvedValueOnce([
        {
          id: testDatasetId1,
          organizationId: testOrgId,
          deletedAt: null,
        },
      ]);

      const result = await hasAllDatasetsAccess(testUserId, [testDatasetId1, testDatasetId2]);

      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      const { getDb } = await import('@buster/database');

      vi.resetModules();
      vi.clearAllMocks();

      const mockDb = createChainableMock();
      mockDb.select.mockRejectedValueOnce(new Error('Database connection failed'));
      vi.mocked(await import('@buster/database')).getDb.mockReturnValue(mockDb);

      const { getPermissionedDatasets } = await import('./access-controls');

      await expect(getPermissionedDatasets(testUserId, 0, 10)).rejects.toThrow();
    });
  });
});
