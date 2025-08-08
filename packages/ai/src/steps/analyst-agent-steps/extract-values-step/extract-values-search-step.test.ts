import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the AI models first, before any imports that might use them
vi.mock('../../../llm/haiku-3-5', () => ({
  Haiku35: 'mock-model',
}));

// Mock the stored-values package
vi.mock('@buster/stored-values/search', () => {
  return {
    generateEmbedding: vi.fn(),
    searchValuesByEmbedding: vi.fn(),
  };
});

// Mock Braintrust
vi.mock('braintrust', () => ({
  wrapTraced: vi.fn((fn) => fn),
  wrapAISDKModel: vi.fn((model) => model),
}));

// Mock the AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

// Mock Mastra
vi.mock('@mastra/core', async () => {
  const actual = await vi.importActual('@mastra/core');
  return {
    ...actual,
    createStep: actual.createStep,
  };
});

// Now import after mocks are set up
import { RuntimeContext } from '@mastra/core/runtime-context';
import type { AnalystRuntimeContext } from '../../../workflows/analyst-agent-workflow/analyst-workflow';
import { extractValuesSearchStep } from './extract-values-search-step';

// Import the mocked functions
import { generateEmbedding, searchValuesByEmbedding } from '@buster/stored-values/search';
import { generateObject } from 'ai';

const mockGenerateEmbedding = generateEmbedding as ReturnType<typeof vi.fn>;
const mockSearchValuesByEmbedding = searchValuesByEmbedding as ReturnType<typeof vi.fn>;
const mockGenerateObject = generateObject as ReturnType<typeof vi.fn>;

describe('extractValuesSearchStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock behavior
    mockGenerateObject.mockResolvedValue({
      object: { values: [] },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('keyword extraction', () => {
    it('should extract keywords from user prompt', async () => {
      const inputData = {
        prompt: 'Show me sales for Red Bull in California',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock the LLM response for keyword extraction
      mockGenerateObject.mockResolvedValue({
        object: { values: ['Red Bull', 'California'] },
      });

      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockResolvedValue([]);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.values).toEqual(['Red Bull', 'California']);
      expect(result.searchPerformed).toBe(true);
    });

    it('should handle empty keyword extraction', async () => {
      const inputData = {
        prompt: 'Show me last month revenue',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      // Should still run even with no keywords
      expect(Array.isArray(result.values)).toBe(true);
      expect(typeof result.searchPerformed).toBe('boolean');
    });
  });

  describe('stored values search', () => {
    it('should skip search when no dataSourceId is provided', async () => {
      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      // No dataSourceId set

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.searchPerformed).toBe(false);
      expect(result.searchResults).toBe('');
      expect(result.foundValues).toEqual({});
    });

    it('should skip search when no keywords are extracted', async () => {
      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock empty keyword extraction
      mockGenerateObject.mockResolvedValue({
        object: { values: [] },
      });

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.values).toEqual([]);
      expect(result.searchPerformed).toBe(false);
    });

    it('should format search results correctly', async () => {
      const mockSearchResults = [
        {
          id: '1',
          value: 'Red Bull Energy',
          schema_name: 'public',
          table_name: 'products',
          column_name: 'name',
          database_name: 'retail',
          synced_at: new Date(),
        },
        {
          id: '2',
          value: 'Red Bull Sugar Free',
          schema_name: 'public',
          table_name: 'products',
          column_name: 'name',
          database_name: 'retail',
          synced_at: new Date(),
        },
        {
          id: '3',
          value: 'Los Angeles',
          schema_name: 'public',
          table_name: 'stores',
          column_name: 'city',
          database_name: 'retail',
          synced_at: new Date(),
        },
      ];

      const inputData = {
        prompt: 'Show me sales for Red Bull',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock successful keyword extraction
      mockGenerateObject.mockResolvedValue({
        object: { values: ['Red Bull'] },
      });

      // Mock successful search
      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockResolvedValue(mockSearchResults);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.searchPerformed).toBe(true);
      expect(result.searchResults).toContain('public.products');
      expect(result.searchResults).toContain('name [Red Bull Energy, Red Bull Sugar Free]');
      expect(result.searchResults).toContain('public.stores');
      expect(result.searchResults).toContain('city [Los Angeles]');
    });

    it('should handle embedding generation errors gracefully', async () => {
      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock LLM extraction success but embedding failure
      mockGenerateObject.mockResolvedValue({
        object: { values: ['test keyword'] },
      });

      mockGenerateEmbedding.mockRejectedValue(new Error('Embedding service unavailable'));

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      // Should not break the workflow
      expect(result.searchPerformed).toBe(false);
      expect(result.searchResults).toBe('');
      expect(result.foundValues).toEqual({});
    });

    it('should handle database search errors gracefully', async () => {
      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock successful keyword extraction
      mockGenerateObject.mockResolvedValue({
        object: { values: ['test keyword'] },
      });

      // Mock successful embedding but database failure
      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockRejectedValue(new Error('Database connection failed'));

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      // Should not break the workflow
      expect(result.searchPerformed).toBe(true); // We attempted the search
      expect(result.searchResults).toBe(''); // But got no results due to error
      expect(result.foundValues).toEqual({});
    });

    it('should handle mixed success/failure in concurrent searches', async () => {
      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock two keywords: one succeeds, one fails
      mockGenerateObject.mockResolvedValue({
        object: { values: ['keyword1', 'keyword2'] },
      });

      mockGenerateEmbedding
        .mockResolvedValueOnce([1, 2, 3]) // First embedding succeeds
        .mockRejectedValueOnce(new Error('Second embedding fails')); // Second fails

      mockSearchValuesByEmbedding.mockResolvedValue([
        {
          id: '1',
          value: 'test value',
          schema_name: 'public',
          table_name: 'test',
          column_name: 'name',
          database_name: 'test',
          synced_at: new Date(),
        },
      ]);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      // Should succeed with partial results
      expect(result.searchPerformed).toBe(true);
      expect(result.searchResults).toContain('test value');
    });
  });

  describe('error handling', () => {
    it('should never throw errors even with complete failure', async () => {
      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock everything to fail
      mockGenerateObject.mockRejectedValue(new Error('LLM failure'));
      mockGenerateEmbedding.mockRejectedValue(new Error('Embedding failure'));
      mockSearchValuesByEmbedding.mockRejectedValue(new Error('Database failure'));

      // Should not throw
      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result).toBeDefined();
      expect(result.values).toEqual([]);
      expect(result.searchPerformed).toBe(false);
      expect(result.searchResults).toBe('');
      expect(result.foundValues).toEqual({});
    });
  });

  describe('LLM extraction behavior', () => {
    it('should handle LLM timeout gracefully', async () => {
      const inputData = {
        prompt: 'Test prompt with timeout',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock LLM timeout
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockGenerateObject.mockRejectedValue(timeoutError);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.values).toEqual([]);
      expect(result.searchPerformed).toBe(false);
    });

    it('should handle malformed LLM response', async () => {
      const inputData = {
        prompt: 'Test malformed response',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock malformed response
      mockGenerateObject.mockResolvedValue({
        object: { wrongField: 'test' }, // Missing 'values' field
      });

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.values).toEqual([]);
      expect(result.searchPerformed).toBe(false);
    });

    it('should handle LLM returning non-array values', async () => {
      const inputData = {
        prompt: 'Test non-array values',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock non-array values
      mockGenerateObject.mockResolvedValue({
        object: { values: 'not an array' },
      });

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.values).toEqual([]);
      expect(result.searchPerformed).toBe(false);
    });
  });

  describe('result formatting', () => {
    it('should deduplicate values within the same column', async () => {
      const mockSearchResults = [
        {
          id: '1',
          value: 'Red Bull',
          schema_name: 'public',
          table_name: 'products',
          column_name: 'name',
          database_name: 'retail',
          synced_at: new Date(),
        },
        {
          id: '2',
          value: 'Red Bull', // Duplicate
          schema_name: 'public',
          table_name: 'products',
          column_name: 'name',
          database_name: 'retail',
          synced_at: new Date(),
        },
      ];

      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock successful keyword extraction
      mockGenerateObject.mockResolvedValue({
        object: { values: ['Red Bull'] },
      });

      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockResolvedValue(mockSearchResults);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      // Should only show "Red Bull" once
      expect(result.foundValues['public.products']?.name).toEqual(['Red Bull']);
      expect(result.searchResults).toContain('name [Red Bull]');
      expect(result.searchResults).not.toContain('Red Bull, Red Bull');
    });

    it('should organize results by schema.table.column structure', async () => {
      const mockSearchResults = [
        {
          id: '1',
          value: 'Product A',
          schema_name: 'sales',
          table_name: 'products',
          column_name: 'name',
          database_name: 'retail',
          synced_at: new Date(),
        },
        {
          id: '2',
          value: 'Category B',
          schema_name: 'sales',
          table_name: 'products',
          column_name: 'category',
          database_name: 'retail',
          synced_at: new Date(),
        },
        {
          id: '3',
          value: 'Store C',
          schema_name: 'inventory',
          table_name: 'locations',
          column_name: 'store_name',
          database_name: 'retail',
          synced_at: new Date(),
        },
      ];

      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock successful keyword extraction
      mockGenerateObject.mockResolvedValue({
        object: { values: ['test'] },
      });

      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockResolvedValue(mockSearchResults);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.foundValues).toEqual({
        'sales.products': {
          name: ['Product A'],
          category: ['Category B'],
        },
        'inventory.locations': {
          store_name: ['Store C'],
        },
      });

      expect(result.searchResults).toContain('sales.products');
      expect(result.searchResults).toContain('inventory.locations');
    });
  });

  describe('performance and concurrency', () => {
    it('should handle large number of extracted values efficiently', async () => {
      const inputData = {
        prompt: 'Large query with many values',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock extraction of many values
      const manyValues = Array.from({ length: 50 }, (_, i) => `Value${i}`);
      mockGenerateObject.mockResolvedValue({
        object: { values: manyValues },
      });

      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockResolvedValue([]);

      const startTime = Date.now();
      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);
      const endTime = Date.now();

      expect(result.values).toEqual(manyValues);
      expect(result.searchPerformed).toBe(true);
      // Should complete in reasonable time (< 10 seconds)
      expect(endTime - startTime).toBeLessThan(10000);
    });

    it('should handle partial embedding generation failures', async () => {
      const inputData = {
        prompt: 'Test partial failures',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      mockGenerateObject.mockResolvedValue({
        object: { values: ['value1', 'value2', 'value3'] },
      });

      // Some embeddings succeed, some fail
      mockGenerateEmbedding
        .mockResolvedValueOnce([1, 2, 3])
        .mockRejectedValueOnce(new Error('Embedding failed'))
        .mockResolvedValueOnce([4, 5, 6]);

      mockSearchValuesByEmbedding.mockResolvedValue([]);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.searchPerformed).toBe(true);
      // Should still work with partial results
      expect(mockSearchValuesByEmbedding).toHaveBeenCalledTimes(2);
    });

    it('should handle AbortError during extraction', async () => {
      const inputData = {
        prompt: 'Test abort',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockGenerateObject.mockRejectedValue(abortError);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.values).toEqual([]);
      expect(result.searchPerformed).toBe(false);
    });
  });

  describe('stored values search edge cases', () => {
    it('should handle empty search results gracefully', async () => {
      const inputData = {
        prompt: 'Find specific value',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      mockGenerateObject.mockResolvedValue({
        object: { values: ['NonExistentValue'] },
      });

      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockResolvedValue([]); // No results

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.searchPerformed).toBe(true);
      expect(result.searchResults).toBe('');
      expect(result.foundValues).toEqual({});
    });

    it('should handle duplicate search results across different tables', async () => {
      const mockSearchResults = [
        {
          id: '1',
          value: 'TestValue',
          schema_name: 'schema1',
          table_name: 'table1',
          column_name: 'col1',
          database_name: 'db',
          synced_at: new Date(),
        },
        {
          id: '2',
          value: 'TestValue',
          schema_name: 'schema2',
          table_name: 'table2',
          column_name: 'col1',
          database_name: 'db',
          synced_at: new Date(),
        },
      ];

      const inputData = {
        prompt: 'Find TestValue',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      mockGenerateObject.mockResolvedValue({
        object: { values: ['TestValue'] },
      });

      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockResolvedValue(mockSearchResults);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.foundValues).toEqual({
        'schema1.table1': { col1: ['TestValue'] },
        'schema2.table2': { col1: ['TestValue'] },
      });
    });

    it('should handle very long value strings', async () => {
      const longValue = 'A'.repeat(1000);
      const inputData = {
        prompt: `Find ${longValue}`,
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      mockGenerateObject.mockResolvedValue({
        object: { values: [longValue] },
      });

      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockResolvedValue([]);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.values).toContain(longValue);
      expect(result.searchPerformed).toBe(true);
    });
  });
});
