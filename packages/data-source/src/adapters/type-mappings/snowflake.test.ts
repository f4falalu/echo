import { describe, expect, it } from 'vitest';
import { getSnowflakeSimpleType, mapSnowflakeType } from './snowflake';

describe('snowflake.test.ts', () => {
  describe('mapSnowflakeType', () => {
    it('should map numeric types correctly', () => {
      expect(mapSnowflakeType('NUMBER')).toBe('decimal');
      expect(mapSnowflakeType('DECIMAL')).toBe('decimal');
      expect(mapSnowflakeType('NUMERIC')).toBe('decimal');
      expect(mapSnowflakeType('INT')).toBe('integer');
      expect(mapSnowflakeType('INTEGER')).toBe('integer');
      expect(mapSnowflakeType('BIGINT')).toBe('bigint');
      expect(mapSnowflakeType('SMALLINT')).toBe('smallint');
      expect(mapSnowflakeType('FIXED')).toBe('decimal'); // Internal Snowflake type
    });

    it('should map floating-point types correctly', () => {
      expect(mapSnowflakeType('FLOAT')).toBe('float');
      expect(mapSnowflakeType('FLOAT4')).toBe('float');
      expect(mapSnowflakeType('FLOAT8')).toBe('double');
      expect(mapSnowflakeType('DOUBLE')).toBe('double');
      expect(mapSnowflakeType('DOUBLE PRECISION')).toBe('double');
      expect(mapSnowflakeType('REAL')).toBe('float');
    });

    it('should map string types correctly', () => {
      expect(mapSnowflakeType('VARCHAR')).toBe('varchar');
      expect(mapSnowflakeType('CHAR')).toBe('char');
      expect(mapSnowflakeType('STRING')).toBe('text');
      expect(mapSnowflakeType('TEXT')).toBe('text');
    });

    it('should map date/time types correctly', () => {
      expect(mapSnowflakeType('DATE')).toBe('date');
      expect(mapSnowflakeType('TIME')).toBe('time');
      expect(mapSnowflakeType('TIMESTAMP')).toBe('timestamp');
      expect(mapSnowflakeType('TIMESTAMP_TZ')).toBe('timestamptz');
      expect(mapSnowflakeType('TIMESTAMP_NTZ')).toBe('timestamp');
      expect(mapSnowflakeType('TIMESTAMP_LTZ')).toBe('timestamptz');
    });

    it('should map semi-structured types correctly', () => {
      expect(mapSnowflakeType('VARIANT')).toBe('json');
      expect(mapSnowflakeType('OBJECT')).toBe('json');
      expect(mapSnowflakeType('ARRAY')).toBe('array');
    });

    it('should handle parameterized types', () => {
      expect(mapSnowflakeType('NUMBER(38,0)')).toBe('decimal');
      expect(mapSnowflakeType('VARCHAR(100)')).toBe('varchar');
      expect(mapSnowflakeType('DECIMAL(10,2)')).toBe('decimal');
    });

    it('should handle lowercase input', () => {
      expect(mapSnowflakeType('number')).toBe('decimal');
      expect(mapSnowflakeType('varchar')).toBe('varchar');
      expect(mapSnowflakeType('timestamp')).toBe('timestamp');
    });

    it('should handle unknown types', () => {
      expect(mapSnowflakeType('UNKNOWN_TYPE')).toBe('text');
      expect(mapSnowflakeType('')).toBe('text');
    });

    it('should handle non-string input', () => {
      expect(mapSnowflakeType(123)).toBe('text');
    });
  });

  describe('getSnowflakeSimpleType', () => {
    it('should categorize numeric types', () => {
      expect(getSnowflakeSimpleType('decimal')).toBe('number');
      expect(getSnowflakeSimpleType('integer')).toBe('number');
      expect(getSnowflakeSimpleType('bigint')).toBe('number');
      expect(getSnowflakeSimpleType('smallint')).toBe('number');
      expect(getSnowflakeSimpleType('float')).toBe('number');
      expect(getSnowflakeSimpleType('double')).toBe('number');
    });

    it('should categorize date/time types', () => {
      expect(getSnowflakeSimpleType('date')).toBe('date');
      expect(getSnowflakeSimpleType('time')).toBe('date');
      expect(getSnowflakeSimpleType('timestamp')).toBe('date');
      expect(getSnowflakeSimpleType('timestamptz')).toBe('date');
    });

    it('should categorize text types', () => {
      expect(getSnowflakeSimpleType('varchar')).toBe('text');
      expect(getSnowflakeSimpleType('char')).toBe('text');
      expect(getSnowflakeSimpleType('text')).toBe('text');
      expect(getSnowflakeSimpleType('json')).toBe('text');
      expect(getSnowflakeSimpleType('array')).toBe('text');
      expect(getSnowflakeSimpleType('boolean')).toBe('text');
    });
  });
});
