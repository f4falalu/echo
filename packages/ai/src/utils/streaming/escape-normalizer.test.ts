import { describe, expect, it } from 'vitest';
import { normalizeEscapedText, unescapeJsonString } from './escape-normalizer';

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

  describe('unescapeJsonString', () => {
    it('should unescape single-escaped newlines', () => {
      expect(unescapeJsonString('Line 1\\nLine 2')).toBe('Line 1\nLine 2');
      expect(unescapeJsonString('Multi\\nLine\\nText')).toBe('Multi\nLine\nText');
    });

    it('should unescape single-escaped tabs', () => {
      expect(unescapeJsonString('Col1\\tCol2')).toBe('Col1\tCol2');
      expect(unescapeJsonString('A\\tB\\tC')).toBe('A\tB\tC');
    });

    it('should unescape single-escaped quotes', () => {
      expect(unescapeJsonString('Say \\"Hello\\"')).toBe('Say "Hello"');
      expect(unescapeJsonString('\\"quoted\\"')).toBe('"quoted"');
    });

    it('should unescape single-escaped backslashes', () => {
      expect(unescapeJsonString('Path\\\\to\\\\file')).toBe('Path\\to\\file');
      expect(unescapeJsonString('C:\\\\Windows\\\\System32')).toBe('C:\\Windows\\System32');
    });

    it('should unescape carriage returns', () => {
      expect(unescapeJsonString('Line 1\\rLine 2')).toBe('Line 1\rLine 2');
    });

    it('should handle mixed escape sequences', () => {
      const input = 'Line 1\\n\\tIndented\\n\\"Quoted\\"\\nPath\\\\file';
      const expected = 'Line 1\n\tIndented\n"Quoted"\nPath\\file';
      expect(unescapeJsonString(input)).toBe(expected);
    });

    it('should handle text without escape sequences', () => {
      const input = 'Normal text without escaping';
      expect(unescapeJsonString(input)).toBe(input);
    });

    it('should handle empty strings', () => {
      expect(unescapeJsonString('')).toBe('');
    });

    it('should handle the streaming JSON extraction case', () => {
      // This simulates what the optimistic parser extracts from raw JSON
      const input = 'First thought\\nSecond thought';
      const expected = 'First thought\nSecond thought';
      expect(unescapeJsonString(input)).toBe(expected);
    });
  });

  describe('combined usage for streaming', () => {
    it('should handle text from optimistic JSON parser', () => {
      // Simulating what comes from the optimistic parser
      const input = 'Thinking step 1\\nThinking step 2';
      const unescaped = unescapeJsonString(input);
      const normalized = normalizeEscapedText(unescaped);
      expect(normalized).toBe('Thinking step 1\nThinking step 2');
    });

    it('should handle double-escaped content after unescaping', () => {
      // If content was double-escaped in JSON
      const input = 'Content with \\\\\\\\n double escape';
      const unescaped = unescapeJsonString(input);
      const normalized = normalizeEscapedText(unescaped);
      expect(normalized).toBe('Content with \n double escape');
    });
  });
});
