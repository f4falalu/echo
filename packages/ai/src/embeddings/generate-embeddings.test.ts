/**
 * Tests for embedding generation functions
 */

import { embedMany } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EMBEDDING_CONFIG,
  batchArray,
  calculateBackoffDelay,
  cosineSimilarity,
  generateEmbeddingsWithDetails,
  generateSearchableValueEmbeddings,
  generateSingleValueEmbedding,
  isRetryableError,
  sleep,
  validateEmbeddingDimensions,
} from './generate-embeddings';

// Mock the AI SDK and Gateway provider
vi.mock('ai', () => ({
  embedMany: vi.fn(),
}));

vi.mock('@ai-sdk/gateway', () => ({
  createGateway: vi.fn(() => ({
    textEmbeddingModel: vi.fn(() => 'mocked-embedding-model'),
  })),
}));

describe('Embedding Generation Utilities', () => {
  describe('batchArray', () => {
    it('should split array into batches of specified size', () => {
      const input = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      const result = batchArray(input, 3);

      expect(result).toEqual([['a', 'b', 'c'], ['d', 'e', 'f'], ['g']]);
    });

    it('should handle empty array', () => {
      const result = batchArray([], 5);
      expect(result).toEqual([]);
    });

    it('should handle batch size larger than array', () => {
      const input = ['a', 'b'];
      const result = batchArray(input, 10);
      expect(result).toEqual([['a', 'b']]);
    });
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff with jitter', () => {
      const baseDelay = 1000;
      const maxDelay = 10000;

      // Test increasing delays
      const delay0 = calculateBackoffDelay(0, baseDelay, maxDelay);
      const delay1 = calculateBackoffDelay(1, baseDelay, maxDelay);
      const delay2 = calculateBackoffDelay(2, baseDelay, maxDelay);

      // Should be approximately exponential (with jitter)
      expect(delay0).toBeGreaterThanOrEqual(1000);
      expect(delay0).toBeLessThan(1200); // 1000 + 10% jitter

      expect(delay1).toBeGreaterThanOrEqual(2000);
      expect(delay1).toBeLessThan(2400); // 2000 + 10% jitter

      expect(delay2).toBeGreaterThanOrEqual(4000);
      expect(delay2).toBeLessThan(4800); // 4000 + 10% jitter
    });

    it('should respect max delay', () => {
      const delay = calculateBackoffDelay(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5500); // 5000 + 10% jitter
    });
  });

  describe('sleep', () => {
    it('should delay for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some variance
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('isRetryableError', () => {
    it('should identify rate limit errors as retryable', () => {
      const error = new Error('Rate limit exceeded');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      const error = new Error('Request timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify network errors as retryable', () => {
      const error = new Error('Network connection failed');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should not identify other errors as retryable', () => {
      const error = new Error('Invalid API key');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should handle non-Error objects', () => {
      expect(isRetryableError('string error')).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });

  describe('validateEmbeddingDimensions', () => {
    it('should validate correct dimensions', () => {
      const embeddings = [
        new Array(1536).fill(0.1),
        new Array(1536).fill(0.2),
        new Array(1536).fill(0.3),
      ];

      expect(validateEmbeddingDimensions(embeddings)).toBe(true);
    });

    it('should reject incorrect dimensions', () => {
      const embeddings = [
        new Array(1536).fill(0.1),
        new Array(1000).fill(0.2), // Wrong dimension
        new Array(1536).fill(0.3),
      ];

      expect(validateEmbeddingDimensions(embeddings)).toBe(false);
    });

    it('should validate with custom dimensions', () => {
      const embeddings = [new Array(768).fill(0.1), new Array(768).fill(0.2)];

      expect(validateEmbeddingDimensions(embeddings, 768)).toBe(true);
      expect(validateEmbeddingDimensions(embeddings, 1536)).toBe(false);
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0, 0];

      expect(cosineSimilarity(embedding1, embedding2)).toBe(1); // Identical
    });

    it('should handle orthogonal vectors', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [0, 1, 0];

      expect(cosineSimilarity(embedding1, embedding2)).toBe(0); // Orthogonal
    });

    it('should handle opposite vectors', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [-1, 0, 0];

      expect(cosineSimilarity(embedding1, embedding2)).toBe(-1); // Opposite
    });

    it('should throw error for mismatched dimensions', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0];

      expect(() => cosineSimilarity(embedding1, embedding2)).toThrow(
        'Embeddings must have the same dimensions'
      );
    });

    it('should handle normalized vectors', () => {
      const embedding1 = [0.6, 0.8];
      const embedding2 = [0.8, 0.6];

      const similarity = cosineSimilarity(embedding1, embedding2);
      expect(similarity).toBeCloseTo(0.96, 2);
    });
  });
});

describe('Embedding Generation Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSearchableValueEmbeddings', () => {
    it('should generate embeddings for values', async () => {
      const mockEmbeddings = [new Array(1536).fill(0.1), new Array(1536).fill(0.2)];

      vi.mocked(embedMany).mockResolvedValue({
        embeddings: mockEmbeddings,
        values: ['test1', 'test2'],
        usage: { tokens: 10 },
      });

      const result = await generateSearchableValueEmbeddings(['test1', 'test2']);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(1536);
      expect(result[1]).toHaveLength(1536);
      expect(embedMany).toHaveBeenCalledTimes(1);
    });

    it('should batch large arrays', async () => {
      const values = Array.from({ length: 250 }, (_, i) => `value_${i}`);
      const mockEmbedding = new Array(1536).fill(0.1);

      vi.mocked(embedMany).mockResolvedValue({
        embeddings: Array(100).fill(mockEmbedding), // Max batch size
        values: [],
        usage: { tokens: 100 },
      });

      await generateSearchableValueEmbeddings(values);

      // Should be called 3 times (100 + 100 + 50)
      expect(embedMany).toHaveBeenCalledTimes(3);
    });

    it('should handle rate limit errors with retry', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);

      vi.mocked(embedMany)
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValueOnce({
          embeddings: [mockEmbedding],
          values: ['test'],
          usage: { tokens: 5 },
        });

      const result = await generateSearchableValueEmbeddings(['test']);

      expect(result).toHaveLength(1);
      expect(embedMany).toHaveBeenCalledTimes(2); // First failed, second succeeded
    });

    it('should throw after max retries', async () => {
      vi.mocked(embedMany).mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(generateSearchableValueEmbeddings(['test'])).rejects.toThrow(
        'Failed to generate embeddings'
      );

      expect(embedMany).toHaveBeenCalledTimes(EMBEDDING_CONFIG.MAX_RETRIES);
    });

    it('should throw immediately for non-retryable errors', async () => {
      vi.mocked(embedMany).mockRejectedValue(new Error('Invalid API key'));

      await expect(generateSearchableValueEmbeddings(['test'])).rejects.toThrow(
        'Failed to generate embeddings'
      );

      expect(embedMany).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('generateSingleValueEmbedding', () => {
    it('should generate embedding for single value', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);

      vi.mocked(embedMany).mockResolvedValue({
        embeddings: [mockEmbedding],
        values: ['test'],
        usage: { tokens: 5 },
      });

      const result = await generateSingleValueEmbedding('test');

      expect(result).toHaveLength(1536);
      expect(embedMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateEmbeddingsWithDetails', () => {
    it('should return detailed results with success', async () => {
      const mockEmbeddings = [new Array(1536).fill(0.1), new Array(1536).fill(0.2)];

      vi.mocked(embedMany).mockResolvedValue({
        embeddings: mockEmbeddings,
        values: ['test1', 'test2'],
        usage: { tokens: 10 },
      });

      const result = await generateEmbeddingsWithDetails({
        values: ['test1', 'test2'],
        model: 'text-embedding-3-small',
      });

      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.embeddings).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);

      // First batch succeeds, second fails
      vi.mocked(embedMany)
        .mockResolvedValueOnce({
          embeddings: Array(100).fill(mockEmbedding),
          values: [],
          usage: { tokens: 100 },
        })
        .mockRejectedValue(new Error('API error'));

      const values = Array.from({ length: 150 }, (_, i) => `value_${i}`);

      const result = await generateEmbeddingsWithDetails({
        values,
        model: 'text-embedding-3-small',
      });

      expect(result.successCount).toBe(100);
      expect(result.failedCount).toBe(50);
      expect(result.embeddings).toHaveLength(150); // Includes empty arrays for failures
      expect(result.errors).toHaveLength(50);
      expect(result.errors[0]?.index).toBeGreaterThanOrEqual(100); // Errors in second batch
    });

    it('should validate input with Zod', async () => {
      await expect(
        generateEmbeddingsWithDetails({
          values: [],
          model: 'text-embedding-3-small',
        })
      ).resolves.toMatchObject({
        successCount: 0,
        failedCount: 0,
        embeddings: [],
        errors: [],
      });

      await expect(
        generateEmbeddingsWithDetails({
          values: [''], // Empty string
          model: 'text-embedding-3-small',
        })
      ).rejects.toThrow(); // Zod validation error
    });
  });
});

describe('Integration Patterns', () => {
  it('should handle rate limiting with proper delays', async () => {
    const values = Array.from({ length: 250 }, (_, i) => `value_${i}`);
    const mockEmbedding = new Array(1536).fill(0.1);

    let callCount = 0;
    const callTimes: number[] = [];

    vi.mocked(embedMany).mockImplementation(async () => {
      callTimes.push(Date.now());
      callCount++;
      return {
        embeddings: Array(Math.min(100, 250 - (callCount - 1) * 100)).fill(mockEmbedding),
        values: [],
        usage: { tokens: 100 },
      };
    });

    await generateSearchableValueEmbeddings(values);

    expect(callCount).toBe(3);

    // Check delays between calls (should be at least RATE_LIMIT_DELAY)
    if (callTimes.length > 1) {
      for (let i = 1; i < callTimes.length; i++) {
        const delay = (callTimes[i] ?? 0) - (callTimes[i - 1] ?? 0);
        expect(delay).toBeGreaterThanOrEqual(EMBEDDING_CONFIG.RATE_LIMIT_DELAY - 10); // Allow small variance
      }
    }
  });

  it('should maintain order of embeddings', async () => {
    const values = ['first', 'second', 'third'];
    const mockEmbeddings = [
      new Array(1536).fill(0.1),
      new Array(1536).fill(0.2),
      new Array(1536).fill(0.3),
    ];

    vi.mocked(embedMany).mockResolvedValue({
      embeddings: mockEmbeddings,
      values,
      usage: { tokens: 15 },
    });

    const result = await generateSearchableValueEmbeddings(values);

    expect(result[0]?.[0]).toBe(0.1);
    expect(result[1]?.[0]).toBe(0.2);
    expect(result[2]?.[0]).toBe(0.3);
  });
});
