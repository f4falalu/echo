import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SnowflakeAdapter } from './snowflake';
import { DataSourceType } from '../types/credentials';
import type { SnowflakeCredentials } from '../types/credentials';
import snowflake from 'snowflake-sdk';

// Get mocked snowflake-sdk
vi.mock('snowflake-sdk');
const mockedSnowflake = vi.mocked(snowflake);


describe('SnowflakeAdapter', () => {
  let adapter: SnowflakeAdapter;
  let mockConnection: any;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new SnowflakeAdapter();
    
    // Create mock connection for each test
    mockConnection = {
      connect: vi.fn((cb) => cb()),
      execute: vi.fn(),
      destroy: vi.fn((cb) => cb()),
      isUp: vi.fn().mockReturnValue(false), // Return false to prevent warm connection reuse
    };
    
    mockedSnowflake.createConnection = vi.fn().mockReturnValue(mockConnection);
    mockedSnowflake.configure = vi.fn();
  });

  describe('initialization', () => {
    it('should initialize with valid credentials', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount.us-east-1',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
        schema: 'PUBLIC',
      };

      await adapter.initialize(credentials);

      expect(mockedSnowflake.createConnection).toHaveBeenCalledWith({
        account: 'testaccount.us-east-1',
        username: 'testuser',
        password: 'testpass',
        warehouse: 'COMPUTE_WH',
        database: 'TESTDB',
      });
      expect(mockConnection.connect).toHaveBeenCalled();
    });

    it('should use no default warehouse when not specified', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);

      expect(mockedSnowflake.createConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          warehouse: undefined,
        })
      );
    });

    it('should use no default database when not specified', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
      };

      await adapter.initialize(credentials);

      expect(mockedSnowflake.createConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          database: undefined,
        })
      );
    });

    it('should handle connection errors gracefully', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      mockConnection.connect.mockImplementation((cb) => cb(new Error('Connection failed')));

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Query execution failed: Failed to connect to Snowflake: Connection failed'
      );
    });

    it('should throw error with invalid credentials type', async () => {
      const credentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Invalid credentials type. Expected snowflake, got postgres'
      );
    });

  });

  describe('query execution', () => {
    const credentials: SnowflakeCredentials = {
      type: DataSourceType.Snowflake,
      account_id: 'testaccount',
      username: 'testuser',
      password: 'testpass',
      warehouse_id: 'COMPUTE_WH',
      default_database: 'TESTDB',
    };

    beforeEach(async () => {
      await adapter.initialize(credentials);
    });

    it('should execute simple query without parameters', async () => {
      const mockRows = [{ ID: 1, NAME: 'Test' }];
      // Reset the mock before this test
      mockConnection.execute.mockReset();
      mockConnection.execute.mockImplementation(({ complete }) => {
        complete(null, { 
          getColumns: () => [
            { getName: () => 'ID', getType: () => 'NUMBER', isNullable: () => false, getScale: () => 0, getPrecision: () => 38 },
            { getName: () => 'NAME', getType: () => 'TEXT', isNullable: () => true, getScale: () => 0, getPrecision: () => 0 },
          ],
        }, mockRows);
      });

      const result = await adapter.query('SELECT * FROM users');

      expect(mockConnection.execute).toHaveBeenCalledWith({
        sqlText: 'SELECT * FROM users',
        binds: undefined,
        complete: expect.any(Function),
      });
      
      expect(result).toEqual({
        rows: mockRows,
        rowCount: 1,
        fields: [
          { name: 'ID', type: 'NUMBER', nullable: false, scale: 0, precision: 38 },
          { name: 'NAME', type: 'TEXT', nullable: true, scale: 0, precision: 0 },
        ],
        hasMoreRows: false,
      });
    });

    it('should execute parameterized query', async () => {
      const mockRows = [{ ID: 1 }];
      mockConnection.execute.mockImplementation(({ complete }) => {
        complete(null, { 
          getColumns: () => [
            { getName: () => 'ID', getType: () => 'NUMBER', isNullable: () => false, getScale: () => 0, getPrecision: () => 38 },
          ],
        }, mockRows);
      });

      const result = await adapter.query('SELECT * FROM users WHERE id = ?', [1]);

      expect(result.rows).toEqual(mockRows);
    });

    it('should handle maxRows limit', async () => {
      const mockRows = Array.from({ length: 15 }, (_, i) => ({ ID: i + 1 }));
      
      mockConnection.execute.mockImplementation(({ complete }) => {
        complete(null, { 
          getColumns: () => [
            { getName: () => 'ID', getType: () => 'NUMBER', isNullable: () => false, getScale: () => 0, getPrecision: () => 38 },
          ],
        }, mockRows);
      });

      const result = await adapter.query('SELECT * FROM users', [], 10);

      expect(result.rows).toHaveLength(10);
      expect(result.hasMoreRows).toBe(true);
    });

    it('should handle query errors', async () => {
      mockConnection.execute.mockImplementation(({ complete }) => {
        complete(new Error('Query failed'));
      });

      await expect(adapter.query('SELECT * FROM invalid_table')).rejects.toThrow(
        'Query execution failed: Query failed'
      );
    });

    it('should throw error when not connected', async () => {
      const disconnectedAdapter = new SnowflakeAdapter();

      await expect(disconnectedAdapter.query('SELECT 1')).rejects.toThrow(
        'snowflake adapter is not connected. Call initialize() first.'
      );
    });

    it('should handle empty result sets', async () => {
      mockConnection.execute.mockImplementation(({ complete }) => {
        complete(null, { 
          getColumns: () => [
            { getName: () => 'ID', getType: () => 'NUMBER', isNullable: () => false, getScale: () => 0, getPrecision: () => 38 },
            { getName: () => 'NAME', getType: () => 'TEXT', isNullable: () => true, getScale: () => 0, getPrecision: () => 0 },
          ],
        }, []);
      });

      const result = await adapter.query('SELECT * FROM users WHERE 1=0');

      expect(result.rows).toEqual([]);
      expect(result.rowCount).toBe(0);
      expect(result.fields).toHaveLength(2);
    });

    it('should handle query timeout', async () => {
      vi.useFakeTimers();
      
      mockConnection.execute.mockImplementation(() => {
        // Never call complete to simulate timeout
      });

      const queryPromise = adapter.query('SELECT 1', [], undefined, 100);

      // Fast-forward past the timeout
      vi.advanceTimersByTime(150);

      await expect(queryPromise).rejects.toThrow(/timeout/i);
      
      vi.useRealTimers();
    });
  });

  describe('connection management', () => {
    it('should test connection successfully', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);
      
      mockConnection.execute.mockImplementation(({ complete }) => {
        complete(null, { 
          getColumns: () => [],
        }, [{ TEST: 1 }]);
      });

      const result = await adapter.testConnection();

      expect(result).toBe(true);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sqlText: 'SELECT 1 as test',
        })
      );
    });

    it('should return false when test connection fails', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);
      
      mockConnection.execute.mockImplementation(({ complete }) => {
        complete(new Error('Connection test failed'));
      });

      const result = await adapter.testConnection();

      expect(result).toBe(false);
    });

    it('should close connection', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);
      await adapter.close();

      expect(mockConnection.destroy).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);
      
      mockConnection.destroy.mockImplementation((cb) => cb(new Error('Close failed')));

      // Should not throw
      await adapter.close();
    });
  });

  describe('introspection', () => {
    it('should return introspector', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);
      
      const introspector = adapter.introspect();
      
      // Just verify it returns an introspector with the correct interface
      expect(introspector).toBeDefined();
      expect(introspector.getDatabases).toBeDefined();
      expect(introspector.getSchemas).toBeDefined();
      expect(introspector.getTables).toBeDefined();
      expect(introspector.getColumns).toBeDefined();
    });

    it('should throw error when trying to introspect without connection', () => {
      expect(() => adapter.introspect()).toThrow(
        'snowflake adapter is not connected. Call initialize() first.'
      );
    });
  });

  describe('data source type', () => {
    it('should return correct data source type', () => {
      expect(adapter.getDataSourceType()).toBe(DataSourceType.Snowflake);
    });
  });

  describe('connection statistics', () => {
    it('should return connection stats', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);
      
      const stats = adapter.getConnectionStats();
      
      expect(stats).toHaveProperty('connected', true);
      expect(stats).toHaveProperty('queries_executed');
      expect(stats).toHaveProperty('queries_successful');
      expect(stats).toHaveProperty('queries_failed');
    });
  });
});