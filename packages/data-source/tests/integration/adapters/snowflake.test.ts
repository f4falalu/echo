import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SnowflakeAdapter } from '../../../src/adapters/snowflake';
import { DataSourceType } from '../../../src/types/credentials';
import type { SnowflakeCredentials } from '../../../src/types/credentials';
import { TEST_TIMEOUT, skipIfNoCredentials, testConfig } from '../../setup';

const testWithCredentials = skipIfNoCredentials('snowflake');

describe('SnowflakeAdapter Integration', () => {
  let adapter: SnowflakeAdapter;
  let credentials: SnowflakeCredentials;

  beforeEach(() => {
    adapter = new SnowflakeAdapter();

    // Set up credentials once
    if (
      !testConfig.snowflake.account_id ||
      !testConfig.snowflake.warehouse_id ||
      !testConfig.snowflake.username ||
      !testConfig.snowflake.password ||
      !testConfig.snowflake.default_database
    ) {
      throw new Error(
        'TEST_SNOWFLAKE_ACCOUNT_ID, TEST_SNOWFLAKE_WAREHOUSE_ID, TEST_SNOWFLAKE_USERNAME, TEST_SNOWFLAKE_PASSWORD, and TEST_SNOWFLAKE_DATABASE are required for this test'
      );
    }

    credentials = {
      type: DataSourceType.Snowflake,
      account_id: testConfig.snowflake.account_id,
      warehouse_id: testConfig.snowflake.warehouse_id,
      username: testConfig.snowflake.username,
      password: testConfig.snowflake.password,
      default_database: testConfig.snowflake.default_database,
      default_schema: testConfig.snowflake.default_schema,
      role: testConfig.snowflake.role,
    };
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  testWithCredentials(
    'should connect to Snowflake',
    async () => {
      await adapter.initialize(credentials);
      const isConnected = await adapter.testConnection();
      expect(isConnected).toBe(true);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should execute simple SELECT query',
    async () => {
      await adapter.initialize(credentials);
      const result = await adapter.query("SELECT 1 as test_column, 'hello' as text_column");

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ TEST_COLUMN: 1, TEXT_COLUMN: 'hello' });
      expect(result.rowCount).toBe(1);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should execute parameterized query',
    async () => {
      await adapter.initialize(credentials);
      const result = await adapter.query('SELECT ? as param_value, ? as second_param', [
        42,
        'test',
      ]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ PARAM_VALUE: 42, SECOND_PARAM: 'test' });
      expect(result.rowCount).toBe(1);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle query errors gracefully',
    async () => {
      await adapter.initialize(credentials);
      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  // New comprehensive tests using TPCH_SF1 data
  testWithCredentials(
    'should query TPCH_SF1 customer table with limit',
    async () => {
      await adapter.initialize(credentials);
      const result = await adapter.query(
        'SELECT C_CUSTKEY, C_NAME, C_NATIONKEY FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER LIMIT 10'
      );

      expect(result.rows).toHaveLength(10);
      expect(result.rowCount).toBe(10);
      expect(result.hasMoreRows).toBe(false);

      // Check that we got the expected columns
      const firstRow = result.rows[0];
      expect(firstRow).toHaveProperty('C_CUSTKEY');
      expect(firstRow).toHaveProperty('C_NAME');
      expect(firstRow).toHaveProperty('C_NATIONKEY');
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle maxRows parameter correctly',
    async () => {
      await adapter.initialize(credentials);
      // Use a smaller table to avoid timeout
      const result = await adapter.query(
        'SELECT * FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.NATION',
        undefined,
        10
      );

      expect(result.rows).toHaveLength(10);
      expect(result.rowCount).toBe(10);
      expect(result.hasMoreRows).toBe(true); // NATION has 25 rows, so there are more
    },
    30000
  );

  testWithCredentials(
    'should execute aggregation query on TPCH data',
    async () => {
      await adapter.initialize(credentials);
      const result = await adapter.query(`
        SELECT 
          N_NAME as nation,
          COUNT(*) as customer_count,
          AVG(C_ACCTBAL) as avg_balance
        FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER c
        JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.NATION n ON c.C_NATIONKEY = n.N_NATIONKEY
        WHERE N_NAME IN ('UNITED STATES', 'CANADA', 'MEXICO')
        GROUP BY N_NAME
        ORDER BY customer_count DESC
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows.length).toBeLessThanOrEqual(3); // We filtered for 3 nations

      // Verify the structure
      const firstRow = result.rows[0];
      expect(firstRow).toHaveProperty('NATION');
      expect(firstRow).toHaveProperty('CUSTOMER_COUNT');
      expect(firstRow).toHaveProperty('AVG_BALANCE');
      expect(typeof firstRow.CUSTOMER_COUNT).toBe('number');
      expect(firstRow.CUSTOMER_COUNT).toBeGreaterThan(0);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle concurrent queries',
    async () => {
      await adapter.initialize(credentials);

      // Create another adapter for parallel execution
      const adapter2 = new SnowflakeAdapter();
      await adapter2.initialize(credentials);

      try {
        // Run queries in parallel
        const [result1, result2] = await Promise.all([
          adapter.query('SELECT COUNT(*) as count FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER'),
          adapter2.query('SELECT COUNT(*) as count FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS'),
        ]);

        expect(result1.rows).toHaveLength(1);
        expect(result2.rows).toHaveLength(1);
        expect(result1.rows[0].COUNT).toBeGreaterThan(0);
        expect(result2.rows[0].COUNT).toBeGreaterThan(0);
      } finally {
        await adapter2.close();
      }
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should respect query timeout',
    async () => {
      await adapter.initialize(credentials);

      // Create a query that will take longer than the timeout
      // Using a complex cross join to ensure it takes time
      await expect(
        adapter.query(
          `SELECT COUNT(*) 
           FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.LINEITEM L1
           CROSS JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.LINEITEM L2
           WHERE L1.L_ORDERKEY = L2.L_ORDERKEY`,
          undefined,
          undefined,
          50 // 50ms timeout - should fail on this heavy query
        )
      ).rejects.toThrow(/timeout/i);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should reuse warm connections',
    async () => {
      await adapter.initialize(credentials);
      const stats1 = adapter.getConnectionStats();

      // Close and create new adapter
      await adapter.close();

      const adapter2 = new SnowflakeAdapter();
      await adapter2.initialize(credentials);

      const stats2 = adapter2.getConnectionStats();
      expect(stats2.isWarmConnection).toBe(true);

      await adapter2.close();
    },
    TEST_TIMEOUT
  );

  testWithCredentials('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.Snowflake);
  });

  testWithCredentials(
    'should fail to connect with invalid credentials',
    async () => {
      const invalidAdapter = new SnowflakeAdapter();
      const invalidCredentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'invalid-account',
        warehouse_id: 'invalid-warehouse',
        username: 'invalid-user',
        password: 'invalid-pass',
        default_database: 'invalid-db',
      };

      await expect(invalidAdapter.initialize(invalidCredentials)).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  // Connection Resilience Tests
  testWithCredentials(
    'should handle empty result sets',
    async () => {
      await adapter.initialize(credentials);

      const result = await adapter.query(
        'SELECT * FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER WHERE 1=0'
      );

      expect(result.rows).toHaveLength(0);
      expect(result.rowCount).toBe(0);
      expect(result.hasMoreRows).toBe(false);
      expect(result.fields.length).toBeGreaterThan(0); // Should still have column metadata
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle NULL values correctly',
    async () => {
      await adapter.initialize(credentials);

      const result = await adapter.query(
        "SELECT NULL as null_col, 'test' as text_col, 123 as num_col"
      );

      expect(result.rows[0].NULL_COL).toBeNull();
      expect(result.rows[0].TEXT_COL).toBe('test');
      expect(result.rows[0].NUM_COL).toBe(123);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle special characters in queries',
    async () => {
      await adapter.initialize(credentials);

      const result = await adapter.query(
        "SELECT 'test''s value' as quoted, 'line1\nline2' as multiline, 'tab\there' as tabbed"
      );

      expect(result.rows[0].QUOTED).toBe("test's value");
      expect(result.rows[0].MULTILINE).toContain('\n');
      expect(result.rows[0].TABBED).toContain('\t');
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle queries with existing LIMIT',
    async () => {
      await adapter.initialize(credentials);

      const result = await adapter.query(
        'SELECT * FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.NATION LIMIT 5',
        undefined,
        10 // maxRows - should handle gracefully
      );

      // Should handle the existing LIMIT properly
      expect(result.rows.length).toBeLessThanOrEqual(6); // 5 + 1 for hasMore check
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle many concurrent adapters',
    async () => {
      const adapters: SnowflakeAdapter[] = [];
      const promises: Promise<any>[] = [];

      // Create 10 adapters concurrently
      for (let i = 0; i < 10; i++) {
        const adapter = new SnowflakeAdapter();
        adapters.push(adapter);
        promises.push(
          adapter.initialize(credentials).then(() => adapter.query(`SELECT ${i} as num`))
        );
      }

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.rows[0].NUM).toBe(i);
      });

      // Cleanup
      await Promise.all(adapters.map((a) => a.close()));
    },
    TEST_TIMEOUT * 2
  );

  testWithCredentials(
    'should handle large result fields',
    async () => {
      await adapter.initialize(credentials);

      // Create a reasonably large string (100KB)
      const largeString = 'x'.repeat(100000);

      const result = await adapter.query(
        `SELECT '${largeString}' as large_text, LENGTH('${largeString}') as text_length`
      );

      expect((result.rows[0].LARGE_TEXT as string).length).toBe(100000);
      expect(result.rows[0].TEXT_LENGTH).toBe(100000);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle wide tables with many columns',
    async () => {
      await adapter.initialize(credentials);

      // LINEITEM table has many columns
      const result = await adapter.query(
        'SELECT * FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.LINEITEM LIMIT 1'
      );

      expect(result.fields.length).toBeGreaterThan(10);
      expect(Object.keys(result.rows[0]).length).toBe(result.fields.length);

      // Verify field metadata
      for (const field of result.fields) {
        expect(field.name).toBeTruthy();
        expect(field.type).toBeTruthy();
        expect(typeof field.nullable).toBe('boolean');
      }
    },
    60000 // Increase timeout to 60 seconds for wide table query
  );

  testWithCredentials(
    'should track connection warmth correctly',
    async () => {
      // Clean up any existing warm connection first
      await SnowflakeAdapter.cleanup();

      // Brief pause after cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      // First adapter - cold start
      const adapter1 = new SnowflakeAdapter();
      await adapter1.initialize(credentials);
      const stats1 = adapter1.getConnectionStats();

      // Check if this connection became the warm connection
      const isFirstConnectionWarm = stats1.isWarmConnection;

      await adapter1.close();

      // Brief pause to ensure proper state
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second adapter - should reuse the warm connection
      const adapter2 = new SnowflakeAdapter();
      await adapter2.initialize(credentials);
      const stats2 = adapter2.getConnectionStats();

      // The second connection should definitely be warm if the first one left a warm connection
      expect(stats2.isWarmConnection).toBe(true);

      await adapter2.close();

      // Clean up after test
      await SnowflakeAdapter.cleanup();
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle connection recovery after forced close',
    async () => {
      await adapter.initialize(credentials);

      // First query should work
      const result1 = await adapter.query('SELECT 1 as test');
      expect(result1.rows[0].TEST).toBe(1);

      // Force close the connection by accessing private properties
      // @ts-expect-error - Testing private property access
      if (adapter.connection) {
        // @ts-expect-error - Testing private property access
        adapter.connection = null;
        // @ts-expect-error - Testing private property access
        adapter.connected = false;
      }

      // Should fail since we broke the connection
      await expect(adapter.query('SELECT 2 as test')).rejects.toThrow();

      // Re-initialize should work
      await adapter.initialize(credentials);
      const result2 = await adapter.query('SELECT 3 as test');
      expect(result2.rows[0].TEST).toBe(3);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should not leak connections on repeated errors',
    async () => {
      const failingAdapters: SnowflakeAdapter[] = [];

      // Create multiple adapters that will have query errors
      for (let i = 0; i < 5; i++) {
        const tempAdapter = new SnowflakeAdapter();
        await tempAdapter.initialize(credentials);

        try {
          await tempAdapter.query(`SELECT * FROM NON_EXISTENT_TABLE_${i}`);
        } catch (e) {
          // Expected to fail
        }

        failingAdapters.push(tempAdapter);
      }

      // All adapters should still be functional despite errors
      for (const failAdapter of failingAdapters) {
        const result = await failAdapter.query('SELECT 1 as recovery_test');
        expect(result.rows[0].RECOVERY_TEST).toBe(1);
      }

      // Clean up
      await Promise.all(failingAdapters.map((a) => a.close()));
    },
    TEST_TIMEOUT * 2
  );

  testWithCredentials(
    'should handle various Snowflake data types',
    async () => {
      await adapter.initialize(credentials);

      const result = await adapter.query(`
        SELECT 
          123::INTEGER as int_col,
          123.456::FLOAT as float_col,
          'test'::VARCHAR as varchar_col,
          TRUE::BOOLEAN as bool_col,
          CURRENT_DATE() as date_col,
          CURRENT_TIMESTAMP() as timestamp_col,
          TO_VARIANT('{"key": "value"}') as variant_col,
          ARRAY_CONSTRUCT(1, 2, 3) as array_col
      `);

      const row = result.rows[0];
      expect(typeof row.INT_COL).toBe('number');
      expect(typeof row.FLOAT_COL).toBe('number');
      expect(typeof row.VARCHAR_COL).toBe('string');
      expect(typeof row.BOOL_COL).toBe('boolean');
      expect(row.DATE_COL).toBeTruthy();
      expect(row.TIMESTAMP_COL).toBeTruthy();
      expect(row.VARIANT_COL).toBeTruthy();
      expect(Array.isArray(row.ARRAY_COL)).toBe(true);
    },
    TEST_TIMEOUT
  );

  // Production Reliability Tests
  testWithCredentials(
    'should handle connection drops gracefully',
    async () => {
      await adapter.initialize(credentials);
      
      // Simulate network interruption by destroying connection
      // @ts-expect-error - Testing private property
      const conn = adapter.connection;
      if (conn) {
        await new Promise<void>((resolve) => {
          conn.destroy((err: any) => {
            resolve();
          });
        });
      }
      
      // Next query should fail
      await expect(adapter.query('SELECT 1')).rejects.toThrow();
      
      // But adapter should be able to reinitialize
      await adapter.initialize(credentials);
      const result = await adapter.query('SELECT 1 as test');
      expect(result.rows[0].TEST).toBe(1);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle query cancellation',
    async () => {
      await adapter.initialize(credentials);
      
      // Start a long-running query and cancel it
      const longQuery = adapter.query(
        `SELECT COUNT(*) FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.LINEITEM 
         CROSS JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER`,
        undefined,
        undefined,
        100 // Very short timeout to force cancellation
      );
      
      await expect(longQuery).rejects.toThrow(/timeout/i);
      
      // Should be able to run another query immediately
      const result = await adapter.query('SELECT 1 as test');
      expect(result.rows[0].TEST).toBe(1);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle very long strings in queries',
    async () => {
      await adapter.initialize(credentials);
      
      // Test with a very long string (1MB)
      const veryLongString = 'x'.repeat(1000000);
      
      // This should work but might be slow
      const result = await adapter.query(
        `SELECT LENGTH('${veryLongString}') as str_length`,
        undefined,
        undefined,
        60000 // 60 second timeout for large string
      );
      
      expect(result.rows[0].STR_LENGTH).toBe(1000000);
    },
    120000 // 2 minute timeout for this test
  );

  testWithCredentials(
    'should handle Unicode and special characters',
    async () => {
      await adapter.initialize(credentials);
      
      const result = await adapter.query(`
        SELECT 
          '🎉emoji🎊' as emoji_text,
          'Chinese: 你好' as chinese_text,
          'Arabic: مرحبا' as arabic_text,
          'Special: <>&"\\/' as special_chars,
          'Line' || CHR(10) || 'Break' as line_break
      `);
      
      expect(result.rows[0].EMOJI_TEXT).toBe('🎉emoji🎊');
      expect(result.rows[0].CHINESE_TEXT).toBe('Chinese: 你好');
      expect(result.rows[0].ARABIC_TEXT).toBe('Arabic: مرحبا');
      expect(result.rows[0].SPECIAL_CHARS).toBe('Special: <>&"/');
      expect(result.rows[0].LINE_BREAK).toContain('\n');
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle extremely large result sets with maxRows',
    async () => {
      await adapter.initialize(credentials);
      
      // Query that would return millions of rows
      const result = await adapter.query(
        'SELECT * FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.LINEITEM',
        undefined,
        1000 // Limit to 1000 rows
      );
      
      expect(result.rows.length).toBe(1000);
      expect(result.hasMoreRows).toBe(true);
      expect(result.rowCount).toBe(1000);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle rapid connection cycling',
    async () => {
      const results = [];
      
      // Rapidly create, use, and close connections
      for (let i = 0; i < 5; i++) {
        const tempAdapter = new SnowflakeAdapter();
        await tempAdapter.initialize(credentials);
        
        const result = await tempAdapter.query(`SELECT ${i} as cycle_num`);
        results.push(result.rows[0].CYCLE_NUM);
        
        await tempAdapter.close();
        // No delay - test rapid cycling
      }
      
      expect(results).toEqual([0, 1, 2, 3, 4]);
    },
    60000 // 1 minute for rapid cycling
  );

  testWithCredentials(
    'should handle warehouse suspension gracefully',
    async () => {
      await adapter.initialize(credentials);
      
      // First query to ensure warehouse is running
      await adapter.query('SELECT 1');
      
      // Note: In production, warehouse might auto-suspend
      // This test simulates querying after potential suspension
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      
      // Should still work (Snowflake should auto-resume)
      const result = await adapter.query('SELECT 2 as test');
      expect(result.rows[0].TEST).toBe(2);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle malformed SQL gracefully',
    async () => {
      await adapter.initialize(credentials);
      
      const malformedQueries = [
        'SELECT * FROM', // Incomplete
        'SELCT * FROM table', // Typo
        'SELECT 1 1', // Syntax error
        'SELECT * FROM "non.existent.schema"."table"', // Invalid schema
        'SELECT 1; DROP TABLE test;', // Multiple statements
      ];
      
      for (const query of malformedQueries) {
        await expect(adapter.query(query)).rejects.toThrow();
      }
      
      // Should still be able to run valid queries
      const result = await adapter.query('SELECT 1 as test');
      expect(result.rows[0].TEST).toBe(1);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle connection pool exhaustion scenario',
    async () => {
      const adapters: SnowflakeAdapter[] = [];
      const promises: Promise<any>[] = [];
      
      // Create many adapters without closing them (simulating pool exhaustion)
      for (let i = 0; i < 20; i++) {
        const tempAdapter = new SnowflakeAdapter();
        adapters.push(tempAdapter);
        
        const promise = tempAdapter.initialize(credentials)
          .then(() => tempAdapter.query(`SELECT ${i} as num`));
        
        promises.push(promise);
      }
      
      // All should complete successfully
      const results = await Promise.all(promises);
      expect(results).toHaveLength(20);
      
      // Cleanup
      await Promise.all(adapters.map(a => a.close()));
    },
    120000 // 2 minutes for many connections
  );

  testWithCredentials(
    'should maintain connection integrity under load',
    async () => {
      await adapter.initialize(credentials);
      
      // Run many queries in parallel on same adapter
      const queryPromises = [];
      for (let i = 0; i < 50; i++) {
        queryPromises.push(
          adapter.query(`SELECT ${i} as num, CURRENT_TIMESTAMP() as ts`)
        );
      }
      
      const results = await Promise.all(queryPromises);
      
      // Verify all queries succeeded and returned correct data
      expect(results).toHaveLength(50);
      results.forEach((result, index) => {
        expect(result.rows[0].NUM).toBe(index);
        expect(result.rows[0].TS).toBeTruthy();
      });
    },
    60000 // 1 minute for load test
  );

  testWithCredentials(
    'should handle binary data correctly',
    async () => {
      await adapter.initialize(credentials);
      
      const result = await adapter.query(`
        SELECT 
          TO_BINARY('48656C6C6F', 'HEX') as hex_binary,
          TO_BINARY('SGVsbG8=', 'BASE64') as base64_binary,
          BASE64_ENCODE(TO_BINARY('48656C6C6F', 'HEX')) as encoded_text
      `);
      
      expect(result.rows[0].HEX_BINARY).toBeTruthy();
      expect(result.rows[0].BASE64_BINARY).toBeTruthy();
      expect(result.rows[0].ENCODED_TEXT).toBe('SGVsbG8=');
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle timezone-aware timestamps',
    async () => {
      await adapter.initialize(credentials);
      
      const result = await adapter.query(`
        SELECT 
          CONVERT_TIMEZONE('UTC', 'America/New_York', '2024-01-01 12:00:00'::TIMESTAMP_NTZ) as ny_time,
          CONVERT_TIMEZONE('UTC', 'Asia/Tokyo', '2024-01-01 12:00:00'::TIMESTAMP_NTZ) as tokyo_time,
          CURRENT_TIMESTAMP() as current_ts,
          SYSDATE() as sys_date
      `);
      
      expect(result.rows[0].NY_TIME).toBeTruthy();
      expect(result.rows[0].TOKYO_TIME).toBeTruthy();
      expect(result.rows[0].CURRENT_TS).toBeTruthy();
      expect(result.rows[0].SYS_DATE).toBeTruthy();
    },
    TEST_TIMEOUT
  );
});
