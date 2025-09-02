import * as databaseModule from '@buster/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as processSyncJobModule from './process-sync-job';
import type { DailySyncReport, DataSourceSyncSummary, SyncJobPayload } from './types';

// Define ScheduledTaskPayload type locally since it's not exported from @trigger.dev/sdk
interface ScheduledTaskPayload {
  timestamp: Date;
  lastTimestamp?: Date;
  upcoming: Date[];
}

// Mock @trigger.dev/sdk
vi.mock('@trigger.dev/sdk', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  schedules: {
    task: vi.fn((config) => config),
  },
}));

// Mock database module
vi.mock('@buster/database', () => ({
  getDataSourcesForSync: vi.fn(),
  getSearchableColumns: vi.fn(),
  batchCreateSyncJobs: vi.fn(),
  markSyncJobInProgress: vi.fn(),
  markSyncJobFailed: vi.fn(),
}));

// Mock process-sync-job module
vi.mock('./process-sync-job', () => ({
  processSyncJob: {
    triggerAndWait: vi.fn(),
  },
}));

describe('sync-searchable-values', () => {
  let syncSearchableValues: any;
  let originalCrypto: typeof globalThis.crypto;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Save original crypto
    originalCrypto = global.crypto;

    // Mock crypto.randomUUID
    const mockCrypto = {
      ...global.crypto,
      randomUUID: vi.fn().mockReturnValue('test-execution-id'),
    };

    // Use Object.defineProperty to override crypto
    Object.defineProperty(global, 'crypto', {
      value: mockCrypto,
      writable: true,
      configurable: true,
    });

    // Dynamically import to get fresh module after mocks
    const module = await import('./sync-searchable-values');
    syncSearchableValues = module.syncSearchableValues;
  });

  afterEach(() => {
    // Restore original crypto
    Object.defineProperty(global, 'crypto', {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
    vi.resetModules();
  });

  describe('Daily Sync Execution', () => {
    const mockPayload: ScheduledTaskPayload = {
      timestamp: new Date('2024-01-15T02:00:00Z'),
      lastTimestamp: new Date('2024-01-14T02:00:00Z'),
      upcoming: [],
    };

    it('should handle case with no data sources', async () => {
      const getDataSourcesForSync = databaseModule.getDataSourcesForSync as any;
      getDataSourcesForSync.mockResolvedValue({
        totalCount: 0,
        dataSources: [],
      });

      const result = await syncSearchableValues.run(mockPayload);

      expect(result).toMatchObject({
        executionId: 'test-execution-id',
        totalDataSources: 0,
        totalColumns: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        skippedSyncs: 0,
        totalValuesProcessed: 0,
        dataSourceSummaries: [],
        errors: [],
      });

      expect(getDataSourcesForSync).toHaveBeenCalledTimes(1);
    });

    it('should process data sources with searchable columns', async () => {
      const getDataSourcesForSync = databaseModule.getDataSourcesForSync as any;
      const getSearchableColumns = databaseModule.getSearchableColumns as any;
      const batchCreateSyncJobs = databaseModule.batchCreateSyncJobs as any;
      const markSyncJobInProgress = databaseModule.markSyncJobInProgress as any;
      const processSyncJob = processSyncJobModule.processSyncJob as any;

      getDataSourcesForSync.mockResolvedValue({
        totalCount: 1,
        dataSources: [
          {
            id: 'ds-1',
            name: 'Test Database',
            columnsWithStoredValues: 3,
          },
        ],
      });

      getSearchableColumns.mockResolvedValue({
        totalCount: 2,
        columns: [
          {
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
          {
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'email',
          },
        ],
      });

      batchCreateSyncJobs.mockResolvedValue({
        totalCreated: 2,
        created: [
          {
            id: 'job-1',
            dataSourceId: 'ds-1',
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
          {
            id: 'job-2',
            dataSourceId: 'ds-1',
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'email',
          },
        ],
        errors: [],
      });

      markSyncJobInProgress.mockResolvedValue(undefined);

      processSyncJob.triggerAndWait.mockResolvedValue({
        ok: true,
        output: {
          success: true,
          processedCount: 100,
          error: null,
        },
      });

      const result = await syncSearchableValues.run(mockPayload);

      expect(result).toMatchObject({
        executionId: 'test-execution-id',
        totalDataSources: 1,
        totalColumns: 2,
        successfulSyncs: 2,
        failedSyncs: 0,
        skippedSyncs: 0,
        totalValuesProcessed: 200,
        errors: [],
      });

      expect(getDataSourcesForSync).toHaveBeenCalledTimes(1);
      expect(getSearchableColumns).toHaveBeenCalledWith({ dataSourceId: 'ds-1' });
      expect(batchCreateSyncJobs).toHaveBeenCalledWith({
        dataSourceId: 'ds-1',
        syncType: 'daily',
        columns: [
          {
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
          {
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'email',
          },
        ],
      });
      expect(processSyncJob.triggerAndWait).toHaveBeenCalledTimes(2);
    });

    it('should handle sync job failures', async () => {
      const getDataSourcesForSync = databaseModule.getDataSourcesForSync as any;
      const getSearchableColumns = databaseModule.getSearchableColumns as any;
      const batchCreateSyncJobs = databaseModule.batchCreateSyncJobs as any;
      const markSyncJobInProgress = databaseModule.markSyncJobInProgress as any;
      const markSyncJobFailed = databaseModule.markSyncJobFailed as any;
      const processSyncJob = processSyncJobModule.processSyncJob as any;

      getDataSourcesForSync.mockResolvedValue({
        totalCount: 1,
        dataSources: [
          {
            id: 'ds-1',
            name: 'Test Database',
            columnsWithStoredValues: 1,
          },
        ],
      });

      getSearchableColumns.mockResolvedValue({
        totalCount: 1,
        columns: [
          {
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
        ],
      });

      batchCreateSyncJobs.mockResolvedValue({
        totalCreated: 1,
        created: [
          {
            id: 'job-1',
            dataSourceId: 'ds-1',
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
        ],
        errors: [],
      });

      markSyncJobInProgress.mockResolvedValue(undefined);
      markSyncJobFailed.mockResolvedValue(undefined);

      processSyncJob.triggerAndWait.mockResolvedValue({
        ok: false,
        error: 'Task execution failed',
      });

      const result = await syncSearchableValues.run(mockPayload);

      expect(result).toMatchObject({
        executionId: 'test-execution-id',
        totalDataSources: 1,
        totalColumns: 1,
        successfulSyncs: 0,
        failedSyncs: 1,
        skippedSyncs: 0,
        totalValuesProcessed: 0,
      });

      expect(result.dataSourceSummaries[0].errors).toContain(
        'Job job-1 failed: Task execution failed'
      );
      expect(markSyncJobFailed).toHaveBeenCalledWith('job-1', 'Task execution failed');
    });

    it('should handle batch creation errors', async () => {
      const getDataSourcesForSync = databaseModule.getDataSourcesForSync as any;
      const getSearchableColumns = databaseModule.getSearchableColumns as any;
      const batchCreateSyncJobs = databaseModule.batchCreateSyncJobs as any;
      const markSyncJobInProgress = databaseModule.markSyncJobInProgress as any;
      const processSyncJob = processSyncJobModule.processSyncJob as any;

      getDataSourcesForSync.mockResolvedValue({
        totalCount: 1,
        dataSources: [
          {
            id: 'ds-1',
            name: 'Test Database',
            columnsWithStoredValues: 2,
          },
        ],
      });

      getSearchableColumns.mockResolvedValue({
        totalCount: 2,
        columns: [
          {
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
          {
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'products',
            columnName: 'description',
          },
        ],
      });

      batchCreateSyncJobs.mockResolvedValue({
        totalCreated: 1,
        created: [
          {
            id: 'job-1',
            dataSourceId: 'ds-1',
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
        ],
        errors: [
          {
            column: {
              tableName: 'products',
              columnName: 'description',
            },
            error: 'Column not found',
          },
        ],
      });

      markSyncJobInProgress.mockResolvedValue(undefined);
      processSyncJob.triggerAndWait.mockResolvedValue({
        ok: true,
        output: {
          success: true,
          processedCount: 100,
          error: null,
        },
      });

      const result = await syncSearchableValues.run(mockPayload);

      expect(result.dataSourceSummaries[0]).toMatchObject({
        totalColumns: 2,
        successfulSyncs: 1,
        failedSyncs: 1,
        errors: ['Failed to create job for products.description: Column not found'],
      });
    });

    it('should skip data sources with no searchable columns', async () => {
      const getDataSourcesForSync = databaseModule.getDataSourcesForSync as any;
      const getSearchableColumns = databaseModule.getSearchableColumns as any;

      getDataSourcesForSync.mockResolvedValue({
        totalCount: 1,
        dataSources: [
          {
            id: 'ds-1',
            name: 'Empty Database',
            columnsWithStoredValues: 0,
          },
        ],
      });

      getSearchableColumns.mockResolvedValue({
        totalCount: 0,
        columns: [],
      });

      const result = await syncSearchableValues.run(mockPayload);

      expect(result).toMatchObject({
        totalDataSources: 1,
        totalColumns: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        skippedSyncs: 0,
        totalValuesProcessed: 0,
      });

      expect(result.dataSourceSummaries[0]).toMatchObject({
        dataSourceId: 'ds-1',
        dataSourceName: 'Empty Database',
        totalColumns: 0,
        skippedSyncs: 0,
      });
    });

    it('should handle processing exceptions gracefully', async () => {
      const getDataSourcesForSync = databaseModule.getDataSourcesForSync as any;
      const getSearchableColumns = databaseModule.getSearchableColumns as any;
      const batchCreateSyncJobs = databaseModule.batchCreateSyncJobs as any;
      const markSyncJobInProgress = databaseModule.markSyncJobInProgress as any;
      const markSyncJobFailed = databaseModule.markSyncJobFailed as any;
      const processSyncJob = processSyncJobModule.processSyncJob as any;

      getDataSourcesForSync.mockResolvedValue({
        totalCount: 1,
        dataSources: [
          {
            id: 'ds-1',
            name: 'Test Database',
            columnsWithStoredValues: 1,
          },
        ],
      });

      getSearchableColumns.mockResolvedValue({
        totalCount: 1,
        columns: [
          {
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
        ],
      });

      batchCreateSyncJobs.mockResolvedValue({
        totalCreated: 1,
        created: [
          {
            id: 'job-1',
            dataSourceId: 'ds-1',
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
        ],
        errors: [],
      });

      markSyncJobInProgress.mockResolvedValue(undefined);
      markSyncJobFailed.mockResolvedValue(undefined);

      // Simulate exception during processSyncJob
      processSyncJob.triggerAndWait.mockRejectedValue(new Error('Network error'));

      const result = await syncSearchableValues.run(mockPayload);

      expect(result).toMatchObject({
        totalDataSources: 1,
        failedSyncs: 1,
        successfulSyncs: 0,
      });

      expect(result.dataSourceSummaries[0].errors).toContain('Job job-1 failed: Network error');
      expect(markSyncJobFailed).toHaveBeenCalledWith('job-1', 'Network error');
    });

    it('should handle fatal errors during execution', async () => {
      const getDataSourcesForSync = databaseModule.getDataSourcesForSync as any;

      getDataSourcesForSync.mockRejectedValue(new Error('Database connection failed'));

      const result = await syncSearchableValues.run(mockPayload);

      expect(result).toMatchObject({
        executionId: 'test-execution-id',
        totalDataSources: 0,
        totalColumns: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        skippedSyncs: 0,
        totalValuesProcessed: 0,
        errors: ['Fatal error during sync execution: Database connection failed'],
      });
    });

    it('should batch process sync jobs correctly', async () => {
      const getDataSourcesForSync = databaseModule.getDataSourcesForSync as any;
      const getSearchableColumns = databaseModule.getSearchableColumns as any;
      const batchCreateSyncJobs = databaseModule.batchCreateSyncJobs as any;
      const markSyncJobInProgress = databaseModule.markSyncJobInProgress as any;
      const processSyncJob = processSyncJobModule.processSyncJob as any;

      // Create 15 jobs to test batching (batch size is 10)
      const mockJobs = Array.from({ length: 15 }, (_, i) => ({
        id: `job-${i + 1}`,
        dataSourceId: 'ds-1',
        databaseName: 'testdb',
        schemaName: 'public',
        tableName: `table${i + 1}`,
        columnName: 'col1',
      }));

      getDataSourcesForSync.mockResolvedValue({
        totalCount: 1,
        dataSources: [
          {
            id: 'ds-1',
            name: 'Test Database',
            columnsWithStoredValues: 15,
          },
        ],
      });

      getSearchableColumns.mockResolvedValue({
        totalCount: 15,
        columns: mockJobs.map((job) => ({
          databaseName: job.databaseName,
          schemaName: job.schemaName,
          tableName: job.tableName,
          columnName: job.columnName,
        })),
      });

      batchCreateSyncJobs.mockResolvedValue({
        totalCreated: 15,
        created: mockJobs,
        errors: [],
      });

      markSyncJobInProgress.mockResolvedValue(undefined);

      let processCallCount = 0;
      processSyncJob.triggerAndWait.mockImplementation(() => {
        processCallCount++;
        return Promise.resolve({
          ok: true,
          output: {
            success: true,
            processedCount: 10,
            error: null,
          },
        });
      });

      const result = await syncSearchableValues.run(mockPayload);

      expect(processCallCount).toBe(15);
      expect(markSyncJobInProgress).toHaveBeenCalledTimes(15);
      expect(result).toMatchObject({
        totalColumns: 15,
        successfulSyncs: 15,
        failedSyncs: 0,
        totalValuesProcessed: 150,
      });
    });

    it('should handle mixed success and failure in batch processing', async () => {
      const getDataSourcesForSync = databaseModule.getDataSourcesForSync as any;
      const getSearchableColumns = databaseModule.getSearchableColumns as any;
      const batchCreateSyncJobs = databaseModule.batchCreateSyncJobs as any;
      const markSyncJobInProgress = databaseModule.markSyncJobInProgress as any;
      const markSyncJobFailed = databaseModule.markSyncJobFailed as any;
      const processSyncJob = processSyncJobModule.processSyncJob as any;

      getDataSourcesForSync.mockResolvedValue({
        totalCount: 1,
        dataSources: [
          {
            id: 'ds-1',
            name: 'Test Database',
            columnsWithStoredValues: 3,
          },
        ],
      });

      getSearchableColumns.mockResolvedValue({
        totalCount: 3,
        columns: [
          {
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
          {
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'email',
          },
          {
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'products',
            columnName: 'title',
          },
        ],
      });

      batchCreateSyncJobs.mockResolvedValue({
        totalCreated: 3,
        created: [
          {
            id: 'job-1',
            dataSourceId: 'ds-1',
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
          {
            id: 'job-2',
            dataSourceId: 'ds-1',
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'email',
          },
          {
            id: 'job-3',
            dataSourceId: 'ds-1',
            databaseName: 'testdb',
            schemaName: 'public',
            tableName: 'products',
            columnName: 'title',
          },
        ],
        errors: [],
      });

      markSyncJobInProgress.mockResolvedValue(undefined);
      markSyncJobFailed.mockResolvedValue(undefined);

      // Mixed results: success, failure, exception
      processSyncJob.triggerAndWait
        .mockResolvedValueOnce({
          ok: true,
          output: {
            success: true,
            processedCount: 50,
            error: null,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          output: {
            success: false,
            processedCount: 0,
            error: 'Validation failed',
          },
        })
        .mockRejectedValueOnce(new Error('Unexpected error'));

      const result = await syncSearchableValues.run(mockPayload);

      expect(result).toMatchObject({
        totalColumns: 3,
        successfulSyncs: 1,
        failedSyncs: 2,
        totalValuesProcessed: 50,
      });

      expect(markSyncJobFailed).toHaveBeenCalledTimes(2);
      expect(markSyncJobFailed).toHaveBeenCalledWith('job-2', 'Validation failed');
      expect(markSyncJobFailed).toHaveBeenCalledWith('job-3', 'Unexpected error');
    });
  });

  describe('createReport helper', () => {
    it('should calculate report metrics correctly', async () => {
      // Since createReport is not exported, we test it through the main function

      const getDataSourcesForSync = databaseModule.getDataSourcesForSync as any;
      const getSearchableColumns = databaseModule.getSearchableColumns as any;
      const batchCreateSyncJobs = databaseModule.batchCreateSyncJobs as any;
      const markSyncJobInProgress = databaseModule.markSyncJobInProgress as any;
      const processSyncJob = processSyncJobModule.processSyncJob as any;

      getDataSourcesForSync.mockResolvedValue({
        totalCount: 2,
        dataSources: [
          { id: 'ds-1', name: 'DB1', columnsWithStoredValues: 2 },
          { id: 'ds-2', name: 'DB2', columnsWithStoredValues: 3 },
        ],
      });

      getSearchableColumns
        .mockResolvedValueOnce({
          totalCount: 2,
          columns: [
            { databaseName: 'db1', schemaName: 'public', tableName: 't1', columnName: 'c1' },
            { databaseName: 'db1', schemaName: 'public', tableName: 't1', columnName: 'c2' },
          ],
        })
        .mockResolvedValueOnce({
          totalCount: 3,
          columns: [
            { databaseName: 'db2', schemaName: 'public', tableName: 't2', columnName: 'c1' },
            { databaseName: 'db2', schemaName: 'public', tableName: 't2', columnName: 'c2' },
            { databaseName: 'db2', schemaName: 'public', tableName: 't2', columnName: 'c3' },
          ],
        });

      batchCreateSyncJobs
        .mockResolvedValueOnce({
          totalCreated: 2,
          created: [
            {
              id: 'j1',
              dataSourceId: 'ds-1',
              databaseName: 'db1',
              schemaName: 'public',
              tableName: 't1',
              columnName: 'c1',
            },
            {
              id: 'j2',
              dataSourceId: 'ds-1',
              databaseName: 'db1',
              schemaName: 'public',
              tableName: 't1',
              columnName: 'c2',
            },
          ],
          errors: [],
        })
        .mockResolvedValueOnce({
          totalCreated: 3,
          created: [
            {
              id: 'j3',
              dataSourceId: 'ds-2',
              databaseName: 'db2',
              schemaName: 'public',
              tableName: 't2',
              columnName: 'c1',
            },
            {
              id: 'j4',
              dataSourceId: 'ds-2',
              databaseName: 'db2',
              schemaName: 'public',
              tableName: 't2',
              columnName: 'c2',
            },
            {
              id: 'j5',
              dataSourceId: 'ds-2',
              databaseName: 'db2',
              schemaName: 'public',
              tableName: 't2',
              columnName: 'c3',
            },
          ],
          errors: [],
        });

      markSyncJobInProgress.mockResolvedValue(undefined);

      // DS1: 2 successes (100 values each)
      // DS2: 1 success (150 values), 1 failure, 1 skip
      processSyncJob.triggerAndWait
        .mockResolvedValueOnce({ ok: true, output: { success: true, processedCount: 100 } })
        .mockResolvedValueOnce({ ok: true, output: { success: true, processedCount: 100 } })
        .mockResolvedValueOnce({ ok: true, output: { success: true, processedCount: 150 } })
        .mockResolvedValueOnce({ ok: false, error: 'Failed' })
        .mockResolvedValueOnce({ ok: true, output: { success: true, processedCount: 0 } }); // Skipped

      const result = await syncSearchableValues.run({
        timestamp: new Date('2024-01-15T02:00:00Z'),
        lastTimestamp: new Date('2024-01-14T02:00:00Z'),
        upcoming: [],
      });

      expect(result).toMatchObject({
        executionId: 'test-execution-id',
        totalDataSources: 2,
        totalColumns: 5,
        successfulSyncs: 4,
        failedSyncs: 1,
        skippedSyncs: 0,
        totalValuesProcessed: 350,
      });

      expect(result.dataSourceSummaries).toHaveLength(2);
      expect(result.dataSourceSummaries[0]).toMatchObject({
        dataSourceId: 'ds-1',
        totalColumns: 2,
        successfulSyncs: 2,
        failedSyncs: 0,
        totalValuesProcessed: 200,
      });
      expect(result.dataSourceSummaries[1]).toMatchObject({
        dataSourceId: 'ds-2',
        totalColumns: 3,
        successfulSyncs: 2,
        failedSyncs: 1,
        totalValuesProcessed: 150,
      });
    });
  });
});
