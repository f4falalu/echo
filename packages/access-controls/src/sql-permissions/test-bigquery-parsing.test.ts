import { describe, expect, it } from 'vitest';
import { extractPhysicalTables } from './parser-helpers';

describe('BigQuery SQL parsing without backticks', () => {
  it('should handle BigQuery project names WITHOUT backticks', () => {
    const sql = 'SELECT * FROM buster-381916.analytics.user';

    console.log('Testing SQL without backticks:', sql);

    try {
      const tables = extractPhysicalTables(sql, 'bigquery');
      console.log('✓ Parser succeeded');
      console.log('Tables extracted:', tables);

      // Check what the parser extracted
      expect(tables).toHaveLength(1);
      console.log('First table:', tables[0]);
    } catch (error) {
      console.log('✗ Parser failed:', error);
      throw error;
    }
  });

  it('should handle BigQuery project names WITH backticks', () => {
    const sql = 'SELECT * FROM `buster-381916`.analytics.user';

    console.log('Testing SQL with backticks:', sql);

    try {
      const tables = extractPhysicalTables(sql, 'bigquery');
      console.log('✓ Parser succeeded');
      console.log('Tables extracted:', tables);

      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({
        database: 'buster-381916',
        schema: 'analytics',
        table: 'user',
        fullName: 'buster-381916.analytics.user',
      });
    } catch (error) {
      console.log('✗ Parser failed:', error);
      throw error;
    }
  });
});
