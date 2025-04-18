import { formatDate } from './date';

describe('formatDate', () => {
  // Test 1: Basic date string formatting
  it('should format a valid date string correctly', () => {
    const result = formatDate({
      date: '2024-03-20',
      format: 'YYYY-MM-DD'
    });
    expect(result).toBe('2024-03-20');
  });

  // Test 2: UTC conversion
  it('should handle UTC conversion correctly', () => {
    const result = formatDate({
      date: '2024-03-20T12:00:00Z',
      format: 'YYYY-MM-DD HH:mm',
      isUTC: true
    });
    expect(result).toBe('2024-03-20 12:00');
  });

  // Test 3: Number to day of week conversion
  it('should convert number to day of week', () => {
    const result = formatDate({
      date: 1,
      format: 'dddd',
      convertNumberTo: 'day_of_week'
    });
    expect(result).toBe('Monday');
  });

  // Test 4: Number to month of year conversion
  it('should convert number to month of year', () => {
    const result = formatDate({
      date: 3,
      format: 'MMMM',
      convertNumberTo: 'month_of_year'
    });
    expect(result).toBe('March');
  });

  // Test 5: Quarter conversion
  it('should format quarter correctly', () => {
    const result = formatDate({
      date: '2024-03-20',
      format: 'YYYY [Q]Q',
      convertNumberTo: 'quarter'
    });
    expect(result).toBe('2024 Q1');
  });

  // Test 6: Invalid date handling
  it('should handle invalid date by returning string representation', () => {
    const result = formatDate({
      date: 'invalid-date',
      format: 'YYYY-MM-DD'
    });
    expect(result).toBe('invalid-date');
  });

  // Test 7: Date object input
  it('should handle Date object input', () => {
    const dateObj = new Date('2024-03-20');
    const result = formatDate({
      date: dateObj,
      format: 'YYYY-MM-DD'
    });
    expect(result).toBe('2024-03-20');
  });

  // Test 8: Unix timestamp (10 digits)
  it('should handle 10-digit unix timestamp', () => {
    const result = formatDate({
      date: 1710921600, // 2024-03-20 00:00:00
      format: 'YYYY-MM-DD'
    });
    expect(result).toBe('2024-03-20');
  });

  // Test 9: Millisecond timestamp (13 digits)
  it('should handle 13-digit millisecond timestamp', () => {
    const result = formatDate({
      date: 1710921600000, // 2024-03-20 00:00:00
      format: 'YYYY-MM-DD'
    });
    expect(result).toBe('2024-03-20');
  });

  // Test 10: Custom date format
  it('should format date with custom format', () => {
    const result = formatDate({
      date: '2024-03-20',
      format: 'MMM ddd, YYYY'
    });
    expect(result).toBe('Mar Wed, 2024');
  });

  // Test 11: Month number with dateKey
  it('should handle month number with dateKey', () => {
    const result = formatDate({
      date: 3,
      format: 'MM',
      dateKey: 'month'
    });
    expect(result).toBe('03');
  });

  // Test 12: Strict validation
  it('should respect ignoreValidation flag', () => {
    const result = formatDate({
      date: 'not-a-date',
      format: 'YYYY-MM-DD',
      ignoreValidation: false
    });
    expect(result).toBe('not-a-date');
  });

  // Test 13: Number conversion fallback
  it('should handle number conversion fallback', () => {
    const result = formatDate({
      date: '123',
      format: 'YYYY-MM-DD',
      convertNumberTo: 'number'
    });
    expect(result).toBe('123');
  });

  // Test 14: Empty input handling
  it('should handle empty input gracefully', () => {
    const result = formatDate({
      date: '',
      format: 'YYYY-MM-DD'
    });
    expect(result).toBe('');
  });
});
