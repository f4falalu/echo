import { describe, it, expect } from 'vitest';
import { ensureTimeFrameQuoted } from './time-frame-helper';

describe('ensureTimeFrameQuoted', () => {
  it('should add quotes to unquoted timeFrame values', () => {
    const input = 'timeFrame: 7d';
    const expected = 'timeFrame: "7d"';
    expect(ensureTimeFrameQuoted(input)).toBe(expected);
  });

  it('should add quotes to unquoted timeFrame values with spaces', () => {
    const input = 'timeFrame:   30d  ';
    const expected = 'timeFrame:   "30d"';
    expect(ensureTimeFrameQuoted(input)).toBe(expected);
  });

  it('should not add quotes to already double-quoted values', () => {
    const input = 'timeFrame: "7d"';
    const expected = 'timeFrame: "7d"';
    expect(ensureTimeFrameQuoted(input)).toBe(expected);
  });

  it('should not add quotes to already single-quoted values', () => {
    const input = "timeFrame: '7d'";
    const expected = "timeFrame: '7d'";
    expect(ensureTimeFrameQuoted(input)).toBe(expected);
  });

  it('should handle multiple timeFrame occurrences', () => {
    const input = `dashboard:
  timeFrame: 7d
  widgets:
    - timeFrame: 30d
    - timeFrame: "90d"`;
    const expected = `dashboard:
  timeFrame: "7d"
  widgets:
    - timeFrame: "30d"
    - timeFrame: "90d"`;
    expect(ensureTimeFrameQuoted(input)).toBe(expected);
  });

  it('should handle timeFrame with no spaces around colon', () => {
    const input = 'timeFrame:7d';
    const expected = 'timeFrame:"7d"';
    expect(ensureTimeFrameQuoted(input)).toBe(expected);
  });

  it('should handle timeFrame with complex values', () => {
    const input = 'timeFrame: last-30-days';
    const expected = 'timeFrame: "last-30-days"';
    expect(ensureTimeFrameQuoted(input)).toBe(expected);
  });

  it('should preserve indentation', () => {
    const input = '    timeFrame: 7d';
    const expected = '    timeFrame: "7d"';
    expect(ensureTimeFrameQuoted(input)).toBe(expected);
  });

  it('should handle empty string', () => {
    const input = '';
    const expected = '';
    expect(ensureTimeFrameQuoted(input)).toBe(expected);
  });

  it('should handle content without timeFrame', () => {
    const input = 'otherField: value\nanotherField: 123';
    const expected = 'otherField: value\nanotherField: 123';
    expect(ensureTimeFrameQuoted(input)).toBe(expected);
  });

  it('should handle timeFrame at end of line with CRLF', () => {
    const input = 'timeFrame: 7d\r\nnextLine: value';
    const expected = 'timeFrame: "7d"\r\nnextLine: value';
    expect(ensureTimeFrameQuoted(input)).toBe(expected);
  });

  it('should handle mixed quote types correctly', () => {
    const input = `timeFrame: 7d
timeFrame: "30d"
timeFrame: '90d'
timeFrame: 1y`;
    const expected = `timeFrame: "7d"
timeFrame: "30d"
timeFrame: '90d'
timeFrame: "1y"`;
    expect(ensureTimeFrameQuoted(input)).toBe(expected);
  });
});