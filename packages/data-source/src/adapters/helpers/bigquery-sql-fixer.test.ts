import { describe, expect, it } from 'vitest';
import { fixBigQueryTableReferences } from './bigquery-sql-fixer';

describe('fixBigQueryTableReferences', () => {
  it('should add backticks to project IDs with hyphens', () => {
    const sql = 'SELECT * FROM buster-381916.analytics.user';
    const expected = 'SELECT * FROM `buster-381916`.analytics.user';
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });

  it('should handle table aliases correctly', () => {
    const sql = 'SELECT u.id FROM buster-381916.analytics.user u';
    const expected = 'SELECT u.id FROM `buster-381916`.analytics.user u';
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });

  it('should handle AS aliases correctly', () => {
    const sql = 'SELECT * FROM my-project.dataset.table AS t';
    const expected = 'SELECT * FROM `my-project`.dataset.table AS t';
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });

  it('should not double-escape already escaped identifiers', () => {
    const sql = 'SELECT * FROM `buster-381916`.analytics.user';
    expect(fixBigQueryTableReferences(sql)).toBe(sql);
  });

  it('should handle fully quoted table references', () => {
    const sql = 'SELECT * FROM `buster-381916.analytics.user`';
    expect(fixBigQueryTableReferences(sql)).toBe(sql);
  });

  it('should handle multiple table references in JOINs', () => {
    const sql = `
      SELECT *
      FROM project-123.dataset1.table1 t1
      JOIN project-456.dataset2.table2 t2 ON t1.id = t2.id
    `;
    const expected = `
      SELECT *
      FROM \`project-123\`.dataset1.table1 t1
      JOIN \`project-456\`.dataset2.table2 t2 ON t1.id = t2.id
    `;
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });

  it('should handle COUNT and other aggregate functions', () => {
    const sql = 'SELECT COUNT(DISTINCT u.user_id) as total_users FROM buster-381916.analytics.user u';
    const expected = 'SELECT COUNT(DISTINCT u.user_id) as total_users FROM `buster-381916`.analytics.user u';
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });

  it('should leave tables without special characters unchanged', () => {
    const sql = 'SELECT * FROM myproject.dataset.table';
    expect(fixBigQueryTableReferences(sql)).toBe(sql);
  });

  it('should handle INSERT INTO statements', () => {
    const sql = 'INSERT INTO project-123.dataset.table VALUES (1, 2, 3)';
    const expected = 'INSERT INTO `project-123`.dataset.table VALUES (1, 2, 3)';
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });

  it('should handle UPDATE statements', () => {
    const sql = 'UPDATE project-123.dataset.table SET col = 1';
    const expected = 'UPDATE `project-123`.dataset.table SET col = 1';
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });

  it('should handle dataset names with special characters', () => {
    const sql = 'SELECT * FROM project.dataset-name.table';
    const expected = 'SELECT * FROM project.`dataset-name`.table';
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });

  it('should handle table names with special characters', () => {
    const sql = 'SELECT * FROM project.dataset.table-name';
    const expected = 'SELECT * FROM project.dataset.`table-name`';
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });

  it('should handle all three parts with special characters', () => {
    const sql = 'SELECT * FROM project-123.dataset-456.table-789';
    const expected = 'SELECT * FROM `project-123`.`dataset-456`.`table-789`';
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });

  it('should handle reserved keywords as identifiers', () => {
    const sql = 'SELECT * FROM project.dataset.select';
    const expected = 'SELECT * FROM project.dataset.`select`';
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });

  it('should handle complex queries with multiple references', () => {
    const sql = `
      WITH user_stats AS (
        SELECT user_id, COUNT(*) as count
        FROM buster-381916.analytics.events
        GROUP BY user_id
      )
      SELECT u.*, s.count
      FROM buster-381916.analytics.user u
      JOIN user_stats s ON u.id = s.user_id
    `;
    const expected = `
      WITH user_stats AS (
        SELECT user_id, COUNT(*) as count
        FROM \`buster-381916\`.analytics.events
        GROUP BY user_id
      )
      SELECT u.*, s.count
      FROM \`buster-381916\`.analytics.user u
      JOIN user_stats s ON u.id = s.user_id
    `;
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });

  it('should handle table references with numbers', () => {
    const sql = 'SELECT * FROM project123.dataset456.table789';
    expect(fixBigQueryTableReferences(sql)).toBe(sql); // No special chars, no change needed
  });

  it('should escape identifiers that start with numbers', () => {
    const sql = 'SELECT * FROM project.dataset.123table';
    const expected = 'SELECT * FROM project.dataset.`123table`';
    expect(fixBigQueryTableReferences(sql)).toBe(expected);
  });
});