import { describe, expect, it } from 'vitest';
import { normalizeRowValues } from './normalize-values';

describe('normalizeRowValues', () => {
  it('should convert string numbers to JavaScript numbers', () => {
    const input = {
      commission_rate_pct: '1.500',
      salesytd: '4251368.5497',
      quantity: '100',
      negative_value: '-45.67',
      product_name: 'Widget XL',
    };

    const result = normalizeRowValues(input);

    expect(result).toEqual({
      commission_rate_pct: 1.5,
      salesytd: 4251368.5497,
      quantity: 100,
      negative_value: -45.67,
      product_name: 'Widget XL',
    });

    // Verify types
    expect(typeof result.commission_rate_pct).toBe('number');
    expect(typeof result.salesytd).toBe('number');
    expect(typeof result.quantity).toBe('number');
    expect(typeof result.negative_value).toBe('number');
    expect(typeof result.product_name).toBe('string');
  });

  it('should convert date strings to Date objects', () => {
    const input = {
      date_only: '2024-01-15',
      iso_timestamp: '2024-01-15T10:30:00Z',
      sql_timestamp: '2024-01-15 10:30:00',
      us_date: '01/15/2024',
      not_a_date: '2024-13-45', // Invalid date
    };

    const result = normalizeRowValues(input);

    expect(result.date_only).toBeInstanceOf(Date);
    expect(result.iso_timestamp).toBeInstanceOf(Date);
    expect(result.sql_timestamp).toBeInstanceOf(Date);
    expect(result.us_date).toBeInstanceOf(Date);
    expect(typeof result.not_a_date).toBe('string'); // Should remain a string
  });

  it('should convert boolean strings to booleans', () => {
    const input = {
      is_active: 'true',
      is_deleted: 'false',
      not_a_bool: 'TRUE', // Uppercase should not convert
      another_text: 'yes',
    };

    const result = normalizeRowValues(input);

    expect(result).toEqual({
      is_active: true,
      is_deleted: false,
      not_a_bool: 'TRUE',
      another_text: 'yes',
    });

    expect(typeof result.is_active).toBe('boolean');
    expect(typeof result.is_deleted).toBe('boolean');
  });

  it('should preserve null and undefined values', () => {
    const input = {
      null_value: null,
      undefined_value: undefined,
      empty_string: '',
      zero: 0,
    };

    const result = normalizeRowValues(input);

    expect(result).toEqual({
      null_value: null,
      undefined_value: undefined,
      empty_string: '',
      zero: 0,
    });
  });

  it('should handle already correct types', () => {
    const input = {
      number_value: 42,
      string_value: 'hello',
      boolean_value: true,
      date_value: new Date('2024-01-15'),
      array_value: [1, 2, 3],
      object_value: { key: 'value' },
    };

    const result = normalizeRowValues(input);

    expect(result).toEqual(input);
  });

  it('should not convert strings that look like numbers but have extra characters', () => {
    const input = {
      version: '1.2.3',
      phone: '555-1234',
      id_with_prefix: 'ID123',
      decimal_with_comma: '1,234.56',
      multiple_dots: '192.168.1.1',
    };

    const result = normalizeRowValues(input);

    // All should remain strings
    expect(result).toEqual(input);
    Object.values(result).forEach((value) => {
      expect(typeof value).toBe('string');
    });
  });

  it('should handle edge cases for numeric strings', () => {
    const input = {
      integer: '42',
      decimal: '3.14',
      negative_int: '-100',
      negative_decimal: '-99.99',
      zero_string: '0',
      zero_decimal: '0.0',
    };

    const result = normalizeRowValues(input);

    expect(result).toEqual({
      integer: 42,
      decimal: 3.14,
      negative_int: -100,
      negative_decimal: -99.99,
      zero_string: 0,
      zero_decimal: 0,
    });
  });

  it('should handle real Snowflake data', () => {
    // Simulating actual Snowflake response
    const snowflakeRow = {
      customer_id: '12345',
      commission_rate_pct: '1.500',
      salesytd: '4251368.5497',
      order_date: '2024-01-15',
      is_premium: 'true',
      customer_name: 'Acme Corp',
      discount_amount: '0.00',
    };

    const result = normalizeRowValues(snowflakeRow);

    expect(result).toEqual({
      customer_id: 12345,
      commission_rate_pct: 1.5,
      salesytd: 4251368.5497,
      order_date: new Date('2024-01-15'),
      is_premium: true,
      customer_name: 'Acme Corp',
      discount_amount: 0,
    });

    // Verify types for scatter plot use case
    expect(typeof result.commission_rate_pct).toBe('number');
    expect(typeof result.salesytd).toBe('number');
  });

  it('should not convert timestamps with trailing text, but allow proper ISO variants', () => {
    const input = {
      tz_abbrev: '2024-01-15 10:30:00 PST',
      trailing_text_after_z: '2024-01-15T10:30:00Z extra',
      trailing_text_after_sql: '2024-01-15 10:30:00 something',
      valid_iso_offset: '2024-01-15T10:30:00-07:00',
      valid_fractional_z: '2024-01-15T10:30:00.123Z',
    };

    const result = normalizeRowValues(input);

    expect(typeof result.tz_abbrev).toBe('string');
    expect(result.tz_abbrev).toBe('2024-01-15 10:30:00 PST');

    expect(typeof result.trailing_text_after_z).toBe('string');
    expect(result.trailing_text_after_z).toBe('2024-01-15T10:30:00Z extra');

    expect(typeof result.trailing_text_after_sql).toBe('string');
    expect(result.trailing_text_after_sql).toBe('2024-01-15 10:30:00 something');

    expect(result.valid_iso_offset).toBeInstanceOf(Date);
    expect(result.valid_fractional_z).toBeInstanceOf(Date);
  });
});
