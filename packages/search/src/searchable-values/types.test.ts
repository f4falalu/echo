import { describe, expect, it } from 'vitest';
import {
  BatchConfigSchema,
  DeduplicationResultSchema,
  ErrorTypeSchema,
  SearchRequestSchema,
  SearchResponseSchema,
  SearchResultSchema,
  SearchableValueSchema,
  SyncErrorSchema,
  SyncJobMetadataSchema,
  SyncJobPayloadSchema,
  SyncJobStatusSchema,
  TurbopufferDocumentSchema,
  TurbopufferQuerySchema,
  UpsertResultSchema,
  createUniqueKey,
  generateNamespace,
  isValidForEmbedding,
  parseUniqueKey,
} from './types';

describe('Searchable Values Types', () => {
  describe('SearchableValueSchema', () => {
    it('should validate a valid searchable value', () => {
      const validValue = {
        database: 'mydb',
        schema: 'public',
        table: 'users',
        column: 'name',
        value: 'John Doe',
      };

      const result = SearchableValueSchema.safeParse(validValue);
      expect(result.success).toBe(true);
    });

    it('should validate with optional embedding and synced_at', () => {
      const validValue = {
        database: 'mydb',
        schema: 'public',
        table: 'users',
        column: 'name',
        value: 'John Doe',
        embedding: new Array(1536).fill(0.1),
        synced_at: '2024-01-01T00:00:00Z',
      };

      const result = SearchableValueSchema.safeParse(validValue);
      expect(result.success).toBe(true);
    });

    it('should reject invalid embedding length', () => {
      const invalidValue = {
        database: 'mydb',
        schema: 'public',
        table: 'users',
        column: 'name',
        value: 'John Doe',
        embedding: new Array(100).fill(0.1), // Wrong length
      };

      const result = SearchableValueSchema.safeParse(invalidValue);
      expect(result.success).toBe(false);
    });

    it('should reject empty required fields', () => {
      const invalidValue = {
        database: '',
        schema: 'public',
        table: 'users',
        column: 'name',
        value: 'John Doe',
      };

      const result = SearchableValueSchema.safeParse(invalidValue);
      expect(result.success).toBe(false);
    });
  });

  describe('TurbopufferQuerySchema', () => {
    it('should validate with only required dataSourceId', () => {
      const query = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = TurbopufferQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should validate with all optional filters', () => {
      const query = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        database: 'mydb',
        schema: 'public',
        table: 'users',
        column: 'name',
      };

      const result = TurbopufferQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const query = {
        dataSourceId: 'not-a-uuid',
      };

      const result = TurbopufferQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });

  describe('SyncJobPayloadSchema', () => {
    it('should validate daily sync job', () => {
      const payload = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        syncType: 'daily',
      };

      const result = SyncJobPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should validate manual sync job with filters', () => {
      const payload = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        syncType: 'manual',
        database: 'mydb',
        table: 'users',
      };

      const result = SyncJobPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid sync type', () => {
      const payload = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        syncType: 'invalid',
      };

      const result = SyncJobPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('BatchConfigSchema', () => {
    it('should use defaults when not specified', () => {
      const config = {};
      const result = BatchConfigSchema.parse(config);

      expect(result.batchSize).toBe(100);
      expect(result.maxRetries).toBe(3);
      expect(result.rateLimitDelay).toBe(1000);
    });

    it('should accept custom values within limits', () => {
      const config = {
        batchSize: 500,
        maxRetries: 5,
        rateLimitDelay: 2000,
      };

      const result = BatchConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it('should reject batch size over limit', () => {
      const config = {
        batchSize: 1001,
      };

      const result = BatchConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    describe('createUniqueKey', () => {
      it('should create a proper unique key', () => {
        const value = {
          database: 'mydb',
          schema: 'public',
          table: 'users',
          column: 'name',
          value: 'John Doe',
        };

        const key = createUniqueKey(value);
        expect(key).toBe('mydb:public:users:name:John Doe');
      });

      it('should handle values with colons', () => {
        const value = {
          database: 'mydb',
          schema: 'public',
          table: 'users',
          column: 'url',
          value: 'https://example.com:8080/path',
        };

        const key = createUniqueKey(value);
        expect(key).toBe('mydb:public:users:url:https://example.com:8080/path');
      });
    });

    describe('parseUniqueKey', () => {
      it('should parse a simple unique key', () => {
        const key = 'mydb:public:users:name:John Doe';
        const parsed = parseUniqueKey(key);

        expect(parsed).toEqual({
          database: 'mydb',
          schema: 'public',
          table: 'users',
          column: 'name',
          value: 'John Doe',
        });
      });

      it('should handle values with colons', () => {
        const key = 'mydb:public:users:url:https://example.com:8080/path';
        const parsed = parseUniqueKey(key);

        expect(parsed).toEqual({
          database: 'mydb',
          schema: 'public',
          table: 'users',
          column: 'url',
          value: 'https://example.com:8080/path',
        });
      });

      it('should throw on invalid key format', () => {
        expect(() => parseUniqueKey('invalid')).toThrow('Invalid unique key format');
        expect(() => parseUniqueKey('only:three:parts')).toThrow('Invalid unique key format');
      });
    });

    describe('generateNamespace', () => {
      it('should generate correct namespace format', () => {
        const dataSourceId = '123e4567-e89b-12d3-a456-426614174000';
        const namespace = generateNamespace(dataSourceId);

        expect(namespace).toBe('ds_123e4567-e89b-12d3-a456-426614174000');
      });
    });

    describe('isValidForEmbedding', () => {
      it('should accept valid text values', () => {
        expect(isValidForEmbedding('John Doe')).toBe(true);
        expect(isValidForEmbedding('This is a valid description')).toBe(true);
        expect(isValidForEmbedding('Product ABC-123')).toBe(true);
      });

      it('should reject empty or whitespace values', () => {
        expect(isValidForEmbedding('')).toBe(false);
        expect(isValidForEmbedding('   ')).toBe(false);
        expect(isValidForEmbedding('\t\n')).toBe(false);
      });

      it('should reject values too short', () => {
        expect(isValidForEmbedding('ab')).toBe(false);
        expect(isValidForEmbedding('1')).toBe(false);
      });

      it('should reject values too long', () => {
        const longValue = 'a'.repeat(8001);
        expect(isValidForEmbedding(longValue)).toBe(false);
      });

      it('should reject UUID values', () => {
        expect(isValidForEmbedding('123e4567-e89b-12d3-a456-426614174000')).toBe(false);
      });

      it('should reject numeric ID values', () => {
        expect(isValidForEmbedding('123456')).toBe(false);
        expect(isValidForEmbedding('9999999')).toBe(false);
      });
    });
  });
});
