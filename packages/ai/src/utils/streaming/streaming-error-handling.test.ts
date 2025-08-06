import { describe, expect, test } from 'vitest';
import { parseStreamingArgs as parseIdleArgs } from '../../tools/communication-tools/idle-tool';
// Note: Some tools have been converted to AI SDK v5 and no longer have parseStreamingArgs
// Only test tools that still have the parseStreamingArgs function
import { parseStreamingArgs as parseExecuteSqlDocsAgentArgs } from '../../tools/database-tools/execute-sql-docs-agent';
import { parseStreamingArgs as parseCreateMetricsArgs } from '../../tools/visualization-tools/create-metrics-file-tool';

describe('Streaming Parser Error Handling', () => {
  const parsers = [
    // Only test tools that still have parseStreamingArgs function
    { name: 'execute-sql-docs-agent', parser: parseExecuteSqlDocsAgentArgs },
    { name: 'create-metrics-file', parser: parseCreateMetricsArgs },
    { name: 'idle-tool', parser: parseIdleArgs },
  ];

  describe('Input Type Validation', () => {
    for (const { name, parser } of parsers) {
      test(`${name} should throw error for null input`, () => {
        expect(() => parser(null as unknown as string)).toThrow(
          'parseStreamingArgs expects string input, got object'
        );
      });

      test(`${name} should throw error for undefined input`, () => {
        expect(() => parser(undefined as unknown as string)).toThrow(
          'parseStreamingArgs expects string input, got undefined'
        );
      });

      test(`${name} should throw error for number input`, () => {
        expect(() => parser(123 as unknown as string)).toThrow(
          'parseStreamingArgs expects string input, got number'
        );
      });

      test(`${name} should throw error for object input`, () => {
        expect(() => parser({} as unknown as string)).toThrow(
          'parseStreamingArgs expects string input, got object'
        );
      });

      test(`${name} should throw error for array input`, () => {
        expect(() => parser([] as unknown as string)).toThrow(
          'parseStreamingArgs expects string input, got object'
        );
      });
    }
  });

  describe('JSON Parse Error Handling (Should be Silent)', () => {
    for (const { name, parser } of parsers) {
      test(`${name} should return null for incomplete JSON (silent error)`, () => {
        const result = parser('{"incomplete":');
        expect(result).toBeNull();
      });

      test(`${name} should return null for malformed JSON (silent error)`, () => {
        const result = parser('{"malformed": "unclosed string');
        expect(result).toBeNull();
      });

      test(`${name} should return null for empty string (silent)`, () => {
        const result = parser('');
        expect(result).toBeNull();
      });
    }
  });

  describe('Regex Error Handling (Should Throw)', () => {
    for (const { name, parser } of parsers) {
      test(`${name} should handle valid string input without throwing`, () => {
        expect(() => parser('valid string')).not.toThrow();
      });
    }
  });

  describe('Successful Parsing (Should Work)', () => {
    test('execute-sql-docs-agent should parse valid complete JSON', () => {
      const validJson = '{"statements": ["SELECT * FROM test"]}';
      const result = parseExecuteSqlDocsAgentArgs(validJson);
      expect(result).toEqual({ statements: ['SELECT * FROM test'] });
    });

    test('create-metrics-file should parse valid complete JSON', () => {
      const validJson = '{"files": [{"name": "test", "yml_content": "content"}]}';
      const result = parseCreateMetricsArgs(validJson);
      expect(result).toEqual({ files: [{ name: 'test', yml_content: 'content' }] });
    });

    test('idle-tool should parse valid complete JSON', () => {
      const validJson = '{"final_response": "Test response"}';
      const result = parseIdleArgs(validJson);
      expect(result).toEqual({ final_response: 'Test response' });
    });
  });
});
