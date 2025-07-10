import {
  and,
  dataSources,
  datasetPermissions,
  datasets,
  datasetsToPermissionGroups,
  eq,
  getDb,
  inArray,
  isNull,
  organizations,
  permissionGroups,
  permissionGroupsToIdentities,
  teams,
  teamsToUsers,
  users,
  usersToOrganizations,
} from '@buster/database';
import { v4 as uuidv4 } from 'uuid';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getPermissionedDatasets, hasAllDatasetsAccess, hasDatasetAccess } from './access-controls';

describe('Access Controls Integration Tests - Organization Default Permission Group', () => {
  const db = getDb();

  // Generate fresh test IDs for each test run to avoid conflicts
  let testOrgId: string;
  let testUserId: string;
  let testDataSourceId: string;
  let testDatasetId1: string;
  let testDatasetId2: string;
  let testDatasetId3: string;
  let testDefaultGroupId: string;
  let testOtherUserId: string;
  let testTeamId: string;

  let testIds: {
    organizationIds: string[];
    userIds: string[];
    dataSourceIds: string[];
    datasetIds: string[];
    permissionGroupIds: string[];
    teamIds: string[];
  };

  beforeEach(async () => {
    // Generate fresh IDs for each test
    testOrgId = uuidv4();
    testUserId = uuidv4();
    testDataSourceId = uuidv4();
    testDatasetId1 = uuidv4();
    testDatasetId2 = uuidv4();
    testDatasetId3 = uuidv4();
    testDefaultGroupId = uuidv4();
    testOtherUserId = uuidv4();
    testTeamId = uuidv4();

    testIds = {
      organizationIds: [testOrgId],
      userIds: [testUserId, testOtherUserId],
      dataSourceIds: [testDataSourceId],
      datasetIds: [testDatasetId1, testDatasetId2, testDatasetId3],
      permissionGroupIds: [testDefaultGroupId],
      teamIds: [testTeamId],
    };
    const now = new Date().toISOString();

    // Create organization first
    await db.insert(organizations).values({
      id: testOrgId,
      name: `Test Organization ${testOrgId}`,
      createdAt: now,
      updatedAt: now,
    });

    // Create users
    await db.insert(users).values([
      {
        id: testUserId,
        email: `test-${testUserId}@example.com`,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: testOtherUserId,
        email: `test-${testOtherUserId}@example.com`,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Create data source
    await db.insert(dataSources).values({
      id: testDataSourceId,
      name: 'Test Data Source',
      type: 'postgres',
      secretId: uuidv4(),
      organizationId: testOrgId,
      createdBy: testUserId,
      updatedBy: testUserId,
      createdAt: now,
      updatedAt: now,
    });

    // Create test organization membership with restricted_querier role (no automatic dataset access)
    await db.insert(usersToOrganizations).values({
      userId: testUserId,
      organizationId: testOrgId,
      role: 'restricted_querier',
      createdAt: now,
      updatedAt: now,
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    // Create default permission group for the organization
    await db.insert(permissionGroups).values({
      id: testDefaultGroupId,
      name: `default:${testOrgId}`,
      organizationId: testOrgId,
      createdAt: now,
      updatedAt: now,
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    // Create test datasets
    await db.insert(datasets).values({
      id: testDatasetId1,
      name: 'Test Dataset 1',
      organizationId: testOrgId,
      dataSourceId: testDataSourceId,
      databaseName: 'test_db_1',
      type: 'table',
      definition: 'SELECT * FROM test_table_1',
      schema: 'public',
      createdAt: now,
      updatedAt: now,
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    await db.insert(datasets).values({
      id: testDatasetId2,
      name: 'Test Dataset 2',
      organizationId: testOrgId,
      dataSourceId: testDataSourceId,
      databaseName: 'test_db_2',
      type: 'table',
      definition: 'SELECT * FROM test_table_2',
      schema: 'public',
      createdAt: now,
      updatedAt: now,
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    await db.insert(datasets).values({
      id: testDatasetId3,
      name: 'Test Dataset 3',
      organizationId: testOrgId,
      dataSourceId: testDataSourceId,
      databaseName: 'test_db_3',
      type: 'table',
      definition: 'SELECT * FROM test_table_3',
      schema: 'public',
      createdAt: now,
      updatedAt: now,
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    // Add datasets 1 and 2 to the default permission group
    await db.insert(datasetsToPermissionGroups).values({
      datasetId: testDatasetId1,
      permissionGroupId: testDefaultGroupId,
      createdAt: now,
      updatedAt: now,
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    await db.insert(datasetsToPermissionGroups).values({
      datasetId: testDatasetId2,
      permissionGroupId: testDefaultGroupId,
      createdAt: now,
      updatedAt: now,
      createdBy: testUserId,
      updatedBy: testUserId,
    });
  });

  afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    await db
      .delete(datasetsToPermissionGroups)
      .where(inArray(datasetsToPermissionGroups.permissionGroupId, testIds.permissionGroupIds));

    await db
      .delete(permissionGroupsToIdentities)
      .where(inArray(permissionGroupsToIdentities.permissionGroupId, testIds.permissionGroupIds));

    await db
      .delete(datasetPermissions)
      .where(inArray(datasetPermissions.datasetId, testIds.datasetIds));

    await db.delete(teamsToUsers).where(inArray(teamsToUsers.userId, testIds.userIds));

    await db.delete(teams).where(inArray(teams.id, testIds.teamIds));

    await db.delete(datasets).where(inArray(datasets.id, testIds.datasetIds));

    await db
      .delete(permissionGroups)
      .where(inArray(permissionGroups.id, testIds.permissionGroupIds));

    await db.delete(dataSources).where(inArray(dataSources.id, testIds.dataSourceIds));

    await db
      .delete(usersToOrganizations)
      .where(inArray(usersToOrganizations.userId, testIds.userIds));

    await db.delete(users).where(inArray(users.id, testIds.userIds));

    await db.delete(organizations).where(inArray(organizations.id, testIds.organizationIds));
  });

  describe('getPermissionedDatasets with org default', () => {
    it('should return datasets in organization default permission group', async () => {
      const datasets = await getPermissionedDatasets(testUserId, 0, 10);

      expect(datasets).toHaveLength(2);
      expect(datasets.map((d) => d.id)).toContain(testDatasetId1);
      expect(datasets.map((d) => d.id)).toContain(testDatasetId2);
      expect(datasets.map((d) => d.id)).not.toContain(testDatasetId3);
    });

    it('should return empty array when user has no organization', async () => {
      const orphanUserId = uuidv4();
      const datasets = await getPermissionedDatasets(orphanUserId, 0, 10);

      expect(datasets).toHaveLength(0);
    });

    it('should return empty array when default permission group does not exist', async () => {
      // Create a new org without default permission group
      const newOrgId = uuidv4();
      const newUserId = uuidv4();

      await db.insert(organizations).values({
        id: newOrgId,
        name: `New Test Organization ${newOrgId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await db.insert(users).values({
        id: newUserId,
        email: `test-${newUserId}@example.com`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await db.insert(usersToOrganizations).values({
        userId: newUserId,
        organizationId: newOrgId,
        role: 'querier',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: newUserId,
        updatedBy: newUserId,
      });

      const datasets = await getPermissionedDatasets(newUserId, 0, 10);
      expect(datasets).toHaveLength(0);

      // Cleanup
      await db.delete(usersToOrganizations).where(eq(usersToOrganizations.userId, newUserId));
      await db.delete(users).where(eq(users.id, newUserId));
      await db.delete(organizations).where(eq(organizations.id, newOrgId));
    });

    it('should not return deleted datasets from default permission group', async () => {
      // Mark dataset1 as deleted
      await db
        .update(datasets)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(datasets.id, testDatasetId1));

      const accessibleDatasets = await getPermissionedDatasets(testUserId, 0, 10);

      expect(accessibleDatasets).toHaveLength(1);
      expect(accessibleDatasets[0].id).toBe(testDatasetId2);

      // Cleanup - restore dataset
      await db.update(datasets).set({ deletedAt: null }).where(eq(datasets.id, testDatasetId1));
    });
  });

  describe('hasDatasetAccess with org default permission', () => {
    it('should grant access to datasets in default permission group', async () => {
      const hasAccess1 = await hasDatasetAccess(testUserId, testDatasetId1);
      const hasAccess2 = await hasDatasetAccess(testUserId, testDatasetId2);
      const hasAccess3 = await hasDatasetAccess(testUserId, testDatasetId3);

      expect(hasAccess1).toBe(true);
      expect(hasAccess2).toBe(true);
      expect(hasAccess3).toBe(false);
    });

    it('should work alongside other permission paths', async () => {
      // Give user direct access to dataset3
      await db.insert(datasetPermissions).values({
        organizationId: testOrgId,
        datasetId: testDatasetId3,
        permissionId: testUserId,
        permissionType: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // User should have access to all three datasets now
      const hasAccess1 = await hasDatasetAccess(testUserId, testDatasetId1);
      const hasAccess2 = await hasDatasetAccess(testUserId, testDatasetId2);
      const hasAccess3 = await hasDatasetAccess(testUserId, testDatasetId3);

      expect(hasAccess1).toBe(true); // Via org default
      expect(hasAccess2).toBe(true); // Via org default
      expect(hasAccess3).toBe(true); // Via direct permission
    });

    it('should respect deleted organization membership', async () => {
      // Mark user's organization membership as deleted
      await db
        .update(usersToOrganizations)
        .set({ deletedAt: new Date().toISOString() })
        .where(
          and(
            eq(usersToOrganizations.userId, testUserId),
            eq(usersToOrganizations.organizationId, testOrgId)
          )
        );

      const hasAccess = await hasDatasetAccess(testUserId, testDatasetId1);
      expect(hasAccess).toBe(false);

      // Cleanup - restore membership
      await db
        .update(usersToOrganizations)
        .set({ deletedAt: null })
        .where(
          and(
            eq(usersToOrganizations.userId, testUserId),
            eq(usersToOrganizations.organizationId, testOrgId)
          )
        );
    });
  });

  describe('hasAllDatasetsAccess with org default permission', () => {
    it('should grant access to all datasets in default permission group', async () => {
      const hasAccess = await hasAllDatasetsAccess(testUserId, [testDatasetId1, testDatasetId2]);
      expect(hasAccess).toBe(true);
    });

    it('should deny access if any dataset is not accessible', async () => {
      const hasAccess = await hasAllDatasetsAccess(testUserId, [
        testDatasetId1,
        testDatasetId2,
        testDatasetId3,
      ]);
      expect(hasAccess).toBe(false);
    });

    it('should handle mixed permission paths', async () => {
      // Create another user in same org
      await db.insert(usersToOrganizations).values({
        userId: testOtherUserId,
        organizationId: testOrgId,
        role: 'restricted_querier',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: testOtherUserId,
        updatedBy: testOtherUserId,
      });

      // Give other user direct access to dataset3
      await db.insert(datasetPermissions).values({
        organizationId: testOrgId,
        datasetId: testDatasetId3,
        permissionId: testOtherUserId,
        permissionType: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Other user should have access to all three datasets
      const hasAccess = await hasAllDatasetsAccess(testOtherUserId, [
        testDatasetId1,
        testDatasetId2,
        testDatasetId3,
      ]);
      expect(hasAccess).toBe(true);
    });
  });

  describe('Integration with admin roles', () => {
    it('should prioritize admin access over org default permission', async () => {
      // Make user an admin
      await db
        .update(usersToOrganizations)
        .set({ role: 'data_admin' })
        .where(
          and(
            eq(usersToOrganizations.userId, testUserId),
            eq(usersToOrganizations.organizationId, testOrgId)
          )
        );

      // Admin should have access to all datasets including dataset3
      const accessibleDatasets = await getPermissionedDatasets(testUserId, 0, 10);
      expect(accessibleDatasets).toHaveLength(3);

      const hasAccess3 = await hasDatasetAccess(testUserId, testDatasetId3);
      expect(hasAccess3).toBe(true);

      // Cleanup - restore to restricted_querier role
      await db
        .update(usersToOrganizations)
        .set({ role: 'restricted_querier' })
        .where(
          and(
            eq(usersToOrganizations.userId, testUserId),
            eq(usersToOrganizations.organizationId, testOrgId)
          )
        );
    });
  });

  describe('Concurrent access path execution', () => {
    it('should handle all permission paths concurrently without conflicts', async () => {
      // Set up multiple permission paths for the same user

      // 1. User already has org default access to dataset1 and dataset2

      // 2. Give user direct access to dataset3
      await db.insert(datasetPermissions).values({
        organizationId: testOrgId,
        datasetId: testDatasetId3,
        permissionId: testUserId,
        permissionType: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 3. Create another permission group and add user to it
      const otherGroupId = uuidv4();
      await db.insert(permissionGroups).values({
        id: otherGroupId,
        name: 'Test Group',
        organizationId: testOrgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: testUserId,
        updatedBy: testUserId,
      });

      await db.insert(permissionGroupsToIdentities).values({
        permissionGroupId: otherGroupId,
        identityId: testUserId,
        identityType: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: testUserId,
        updatedBy: testUserId,
      });

      // 4. Add dataset1 to the other group (duplicate access)
      await db.insert(datasetsToPermissionGroups).values({
        datasetId: testDatasetId1,
        permissionGroupId: otherGroupId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: testUserId,
        updatedBy: testUserId,
      });

      // Test that all paths work correctly and deduplication happens
      const datasets = await getPermissionedDatasets(testUserId, 0, 10);

      // Should have all 3 datasets with no duplicates
      expect(datasets).toHaveLength(3);
      expect(new Set(datasets.map((d) => d.id)).size).toBe(3); // Ensure no duplicates

      // Cleanup
      await db
        .delete(datasetsToPermissionGroups)
        .where(eq(datasetsToPermissionGroups.permissionGroupId, otherGroupId));
      await db
        .delete(permissionGroupsToIdentities)
        .where(eq(permissionGroupsToIdentities.permissionGroupId, otherGroupId));
      await db.delete(permissionGroups).where(eq(permissionGroups.id, otherGroupId));
    });
  });
});
