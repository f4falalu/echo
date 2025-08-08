import { describe, expect, it } from 'vitest';
import { normalizeEscapedText } from './escape-normalizer';

describe('escape-normalizer', () => {
  describe('normalizeEscapedText', () => {
    it('should normalize double-escaped newlines', () => {
      expect(normalizeEscapedText('Hello\\\\nWorld')).toBe('Hello\nWorld');
      expect(normalizeEscapedText('Line 1\\\\nLine 2\\\\nLine 3')).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should normalize double-escaped tabs', () => {
      expect(normalizeEscapedText('Name\\\\tValue')).toBe('Name\tValue');
      expect(normalizeEscapedText('Col1\\\\tCol2\\\\tCol3')).toBe('Col1\tCol2\tCol3');
    });

    it('should normalize double-escaped quotes', () => {
      expect(normalizeEscapedText('Say \\\\"Hello\\\\"')).toBe('Say "Hello"');
      expect(normalizeEscapedText('\\\\"quoted text\\\\"')).toBe('"quoted text"');
    });

    it('should normalize double-escaped backslashes', () => {
      // Test pure backslash normalization
      expect(normalizeEscapedText('Path\\\\\\\\file')).toBe('Path\\\\file');
      // Test that we normalize escape sequences properly
      expect(normalizeEscapedText('Line1\\\\nLine2')).toBe('Line1\nLine2');
    });

    it('should handle complex mixed escaping', () => {
      const input = 'Line 1\\\\n\\\\tIndented\\\\n\\\\"Quote\\\\"\\\\nEnd';
      const expected = 'Line 1\n\tIndented\n"Quote"\nEnd';
      expect(normalizeEscapedText(input)).toBe(expected);
    });

    it('should not modify properly escaped text', () => {
      const properlyEscaped = 'Hello\nWorld\tTabbed "Quoted"';
      expect(normalizeEscapedText(properlyEscaped)).toBe(properlyEscaped);
    });

    it('should handle the specific case from the bug report', () => {
      const input =
        'Let me check the customer data structure to understand how to get customer names for the visualization.\\\\n\\\\nLooking at the customer model relationships:\\\\n- `customer` references `person` (for individual customers) via `personid`\\\\n- `customer` references `store` (for business customers) via `storeid`\\\\n- `person` has `firstname`, `lastname` fields\\\\n- `store` has `name` field\\\\n\\\\nI should query the data to see what the customer records look like and how to properly get customer names. This will help me plan the correct SQL query for the visualization.';

      const expected =
        'Let me check the customer data structure to understand how to get customer names for the visualization.\n\nLooking at the customer model relationships:\n- `customer` references `person` (for individual customers) via `personid`\n- `customer` references `store` (for business customers) via `storeid`\n- `person` has `firstname`, `lastname` fields\n- `store` has `name` field\n\nI should query the data to see what the customer records look like and how to properly get customer names. This will help me plan the correct SQL query for the visualization.';

      expect(normalizeEscapedText(input)).toBe(expected);
    });

    it('should handle text that does not need normalization', () => {
      const input = 'Regular text with no double escaping';
      expect(normalizeEscapedText(input)).toBe(input);
    });

    it('should handle empty strings', () => {
      expect(normalizeEscapedText('')).toBe('');
    });
  });
});
