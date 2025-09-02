import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import * as syncJobs from './index';

// Mock the database connection
vi.mock('../../connection', () => ({
  db: {
    select: vi.fn(),
    selectDistinct: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    and: vi.fn(),
    eq: vi.fn(),
    inArray: vi.fn(),
    isNull: vi.fn(),
  },
}));

describe('Sync Jobs Query Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDataSourcesForSync', () => {
    it('should validate and return data sources with searchable columns', async () => {
      // This test validates the schema structure
      const mockOutput: syncJobs.GetDataSourcesForSyncOutput = {
        dataSources: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Test Data Source',
            type: 'postgresql',
            organizationId: '123e4567-e89b-12d3-a456-426614174001',
            columnsWithStoredValues: 5,
          },
        ],
        totalCount: 1,
      };

      // Validate output schema
      const validated = syncJobs.GetDataSourcesForSyncOutputSchema.parse(mockOutput);
      expect(validated.dataSources).toHaveLength(1);
      expect(validated.dataSources[0]?.columnsWithStoredValues).toBe(5);
    });

    it('should reject invalid data source data', () => {
      const invalidData = {
        dataSources: [
          {
            id: 'not-a-uuid',
            name: 'Test',
            type: 'postgresql',
            organizationId: '123e4567-e89b-12d3-a456-426614174001',
            columnsWithStoredValues: -1, // Invalid: negative count
          },
        ],
        totalCount: 1,
      };

      expect(() => syncJobs.GetDataSourcesForSyncOutputSchema.parse(invalidData)).toThrow(
        z.ZodError
      );
    });
  });

  describe('createSearchableValuesSyncJob', () => {
    it('should validate sync job input', () => {
      const validInput: syncJobs.CreateSyncJobInput = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        databaseName: 'analytics',
        schemaName: 'public',
        tableName: 'users',
        columnName: 'email',
        syncType: 'daily',
      };

      const validated = syncJobs.CreateSyncJobInputSchema.parse(validInput);
      expect(validated.syncType).toBe('daily');
      expect(validated.databaseName).toBe('analytics');
    });

    it('should reject empty strings in required fields', () => {
      const invalidInput = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        databaseName: '', // Invalid: empty string
        schemaName: 'public',
        tableName: 'users',
        columnName: 'email',
      };

      expect(() => syncJobs.CreateSyncJobInputSchema.parse(invalidInput)).toThrow(z.ZodError);
    });

    it('should validate batch create input', () => {
      const batchInput: syncJobs.BatchCreateSyncJobsInput = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        syncType: 'manual',
        columns: [
          {
            databaseName: 'analytics',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'email',
          },
          {
            databaseName: 'analytics',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
        ],
      };

      const validated = syncJobs.BatchCreateSyncJobsInputSchema.parse(batchInput);
      expect(validated.columns).toHaveLength(2);
      expect(validated.syncType).toBe('manual');
    });
  });

  describe('updateSyncJobStatus', () => {
    it('should validate status update input', () => {
      const validInput: syncJobs.UpdateSyncJobStatusInput = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'completed',
        metadata: {
          processedCount: 100,
          existingCount: 20,
          newCount: 80,
          duration: 5000,
          syncedAt: new Date().toISOString(),
        },
      };

      const validated = syncJobs.UpdateSyncJobStatusInputSchema.parse(validInput);
      expect(validated.status).toBe('completed');
      expect(validated.metadata?.processedCount).toBe(100);
    });

    it('should validate all sync job statuses', () => {
      const validStatuses: syncJobs.SyncJobStatus[] = [
        'pending',
        'pending_manual',
        'pending_initial',
        'in_progress',
        'completed',
        'failed',
        'cancelled',
        'skipped',
      ];

      for (const status of validStatuses) {
        const validated = syncJobs.SyncJobStatusSchema.parse(status);
        expect(validated).toBe(status);
      }
    });

    it('should reject invalid status', () => {
      expect(() => syncJobs.SyncJobStatusSchema.parse('invalid_status')).toThrow(z.ZodError);
    });

    it('should validate bulk update input', () => {
      const bulkInput: syncJobs.BulkUpdateSyncJobsInput = {
        jobIds: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
        status: 'cancelled',
        errorMessage: 'Batch operation cancelled by user',
      };

      const validated = syncJobs.BulkUpdateSyncJobsInputSchema.parse(bulkInput);
      expect(validated.jobIds).toHaveLength(2);
      expect(validated.status).toBe('cancelled');
    });

    it('should reject empty jobIds array', () => {
      const invalidInput = {
        jobIds: [], // Invalid: empty array
        status: 'cancelled',
      };

      expect(() => syncJobs.BulkUpdateSyncJobsInputSchema.parse(invalidInput)).toThrow(z.ZodError);
    });
  });

  describe('getSearchableColumns', () => {
    it('should validate searchable columns output', () => {
      const mockColumn: syncJobs.SearchableColumn = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        datasetId: '123e4567-e89b-12d3-a456-426614174001',
        datasetName: 'users_dataset',
        databaseName: 'analytics',
        schemaName: 'public',
        tableName: 'users_dataset',
        columnName: 'email',
        columnType: 'varchar',
        description: null,
        semanticType: null,
        storedValuesStatus: 'success',
        storedValuesError: null,
        storedValuesCount: 1000,
        storedValuesLastSynced: new Date().toISOString(),
      };

      const validated = syncJobs.SearchableColumnSchema.parse(mockColumn);
      expect(validated.columnName).toBe('email');
      expect(validated.storedValuesCount).toBe(1000);
    });

    it('should validate columns needing sync output', () => {
      const mockOutput: syncJobs.ColumnsNeedingSyncOutput = {
        columns: [],
        totalCount: 0,
        neverSynced: 0,
        stale: 0,
      };

      const validated = syncJobs.ColumnsNeedingSyncOutputSchema.parse(mockOutput);
      expect(validated.totalCount).toBe(0);
      expect(validated.neverSynced).toBe(0);
    });

    it('should validate get searchable columns output with grouping', () => {
      const mockColumn: syncJobs.SearchableColumn = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        datasetId: '123e4567-e89b-12d3-a456-426614174001',
        datasetName: 'users_dataset',
        databaseName: 'analytics',
        schemaName: 'public',
        tableName: 'users_dataset',
        columnName: 'email',
        columnType: 'varchar',
        description: null,
        semanticType: null,
        storedValuesStatus: null,
        storedValuesError: null,
        storedValuesCount: null,
        storedValuesLastSynced: null,
      };

      const mockOutput: syncJobs.GetSearchableColumnsOutput = {
        columns: [mockColumn],
        totalCount: 1,
        byDataset: {
          '123e4567-e89b-12d3-a456-426614174001': {
            datasetName: 'users_dataset',
            columns: [mockColumn],
            count: 1,
          },
        },
      };

      const validated = syncJobs.GetSearchableColumnsOutputSchema.parse(mockOutput);
      expect(validated.totalCount).toBe(1);
      expect(validated.byDataset).toHaveProperty('123e4567-e89b-12d3-a456-426614174001');
    });
  });

  describe('Schema Edge Cases', () => {
    it('should handle nullable fields correctly', () => {
      const column: syncJobs.SearchableColumn = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        datasetId: '123e4567-e89b-12d3-a456-426614174001',
        datasetName: 'test',
        databaseName: 'db',
        schemaName: 'schema',
        tableName: 'table',
        columnName: 'col',
        columnType: 'text',
        description: null,
        semanticType: null,
        storedValuesStatus: null,
        storedValuesError: null,
        storedValuesCount: null,
        storedValuesLastSynced: null,
      };

      const validated = syncJobs.SearchableColumnSchema.parse(column);
      expect(validated.description).toBeNull();
      expect(validated.storedValuesCount).toBeNull();
    });

    it('should validate datetime strings', () => {
      const validDatetime = '2024-01-01T12:00:00.000Z';
      const invalidDatetime = '2024-01-01 12:00:00'; // Missing T and Z

      const column = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        datasetId: '123e4567-e89b-12d3-a456-426614174001',
        datasetName: 'test',
        databaseName: 'db',
        schemaName: 'schema',
        tableName: 'table',
        columnName: 'col',
        columnType: 'text',
        description: null,
        semanticType: null,
        storedValuesStatus: null,
        storedValuesError: null,
        storedValuesCount: null,
        storedValuesLastSynced: validDatetime,
      };

      // Should accept valid datetime
      const validated = syncJobs.SearchableColumnSchema.parse(column);
      expect(validated.storedValuesLastSynced).toBe(validDatetime);

      // Should reject invalid datetime
      column.storedValuesLastSynced = invalidDatetime;
      expect(() => syncJobs.SearchableColumnSchema.parse(column)).toThrow(z.ZodError);
    });

    it('should validate UUID formats', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const invalidUuid = '123-456-789';

      // Valid UUID
      const validInput = { dataSourceId: validUuid };
      const validated = syncJobs.GetSearchableColumnsInputSchema.parse(validInput);
      expect(validated.dataSourceId).toBe(validUuid);

      // Invalid UUID
      const invalidInput = { dataSourceId: invalidUuid };
      expect(() => syncJobs.GetSearchableColumnsInputSchema.parse(invalidInput)).toThrow(
        z.ZodError
      );
    });
  });

  describe('Type Exports', () => {
    it('should export all required types', () => {
      // Verify type exports exist (TypeScript will check at compile time)
      const _dataSourceType: syncJobs.DataSourceForSync = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test',
        type: 'postgresql',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        columnsWithStoredValues: 0,
      };

      const _syncJobInput: syncJobs.CreateSyncJobInput = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        databaseName: 'db',
        schemaName: 'schema',
        tableName: 'table',
        columnName: 'column',
      };

      const _searchableColumn: syncJobs.SearchableColumn = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        datasetId: '123e4567-e89b-12d3-a456-426614174001',
        datasetName: 'test',
        databaseName: 'db',
        schemaName: 'schema',
        tableName: 'table',
        columnName: 'col',
        columnType: 'text',
        description: null,
        semanticType: null,
        storedValuesStatus: null,
        storedValuesError: null,
        storedValuesCount: null,
        storedValuesLastSynced: null,
      };

      // Types are valid if this compiles
      expect(true).toBe(true);
    });
  });
});
