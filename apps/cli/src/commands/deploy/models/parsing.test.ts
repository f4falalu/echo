import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Model } from '../schemas';
import {
  ModelParsingError,
  generateDefaultSQL,
  parseModelFile,
  resolveModelConfig,
  validateModel,
} from './parsing';

describe('parsing', () => {
  let testDir: string;

  beforeEach(async () => {
    const testId = Math.random().toString(36).substring(7);
    testDir = join(tmpdir(), `buster-cli-test-${testId}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('resolveModelConfig', () => {
    describe('cascading configuration', () => {
      const baseConfig = {
        data_source_name: 'global_postgres',
        database: 'global_db',
        schema: 'global_schema',
      };

      it('should use global config values when model values are undefined', () => {
        const model: Model = {
          name: 'test_model',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.data_source_name).toBe('global_postgres');
        expect(resolved.database).toBe('global_db');
        expect(resolved.schema).toBe('global_schema');
      });

      it('should use model values when they override global config', () => {
        const model: Model = {
          name: 'test_model',
          data_source_name: 'model_mysql',
          database: 'model_db',
          schema: 'model_schema',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.data_source_name).toBe('model_mysql');
        expect(resolved.database).toBe('model_db');
        expect(resolved.schema).toBe('model_schema');
      });

      it('should handle partial overrides - only data_source_name', () => {
        const model: Model = {
          name: 'test_model',
          data_source_name: 'model_bigquery',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.data_source_name).toBe('model_bigquery');
        expect(resolved.database).toBe('global_db');
        expect(resolved.schema).toBe('global_schema');
      });

      it('should handle partial overrides - only database', () => {
        const model: Model = {
          name: 'test_model',
          database: 'model_specific_db',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.data_source_name).toBe('global_postgres');
        expect(resolved.database).toBe('model_specific_db');
        expect(resolved.schema).toBe('global_schema');
      });

      it('should handle partial overrides - only schema', () => {
        const model: Model = {
          name: 'test_model',
          schema: 'model_specific_schema',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.data_source_name).toBe('global_postgres');
        expect(resolved.database).toBe('global_db');
        expect(resolved.schema).toBe('model_specific_schema');
      });

      it('should handle mixed overrides - data_source and schema', () => {
        const model: Model = {
          name: 'test_model',
          data_source_name: 'model_snowflake',
          schema: 'model_warehouse',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.data_source_name).toBe('model_snowflake');
        expect(resolved.database).toBe('global_db');
        expect(resolved.schema).toBe('model_warehouse');
      });

      it('should handle empty config object', () => {
        const model: Model = {
          name: 'test_model',
          data_source_name: 'model_postgres',
          database: 'model_db',
          schema: 'model_schema',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        };

        const resolved = resolveModelConfig(model, {});

        expect(resolved.data_source_name).toBe('model_postgres');
        expect(resolved.database).toBe('model_db');
        expect(resolved.schema).toBe('model_schema');
      });

      it('should handle undefined values in config', () => {
        const model: Model = {
          name: 'test_model',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        };

        const partialConfig = {
          data_source_name: 'config_postgres',
          database: undefined,
          schema: undefined,
        };

        const resolved = resolveModelConfig(model, partialConfig);

        expect(resolved.data_source_name).toBe('config_postgres');
        expect(resolved.database).toBeUndefined();
        expect(resolved.schema).toBeUndefined();
      });

      it('should preserve other model properties during resolution', () => {
        const model: Model = {
          name: 'test_model',
          description: 'Test model description',
          dimensions: [
            { name: 'id', searchable: false },
            { name: 'name', searchable: true, type: 'string' },
          ],
          measures: [{ name: 'count', type: 'integer' }],
          metrics: [{ name: 'total', expr: 'sum(count)' }],
          filters: [{ name: 'active', expr: 'status = "active"' }],
          relationships: [
            { name: 'user_rel', source_col: 'user_id', ref_col: 'users.id' },
          ],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.name).toBe('test_model');
        expect(resolved.description).toBe('Test model description');
        expect(resolved.dimensions).toEqual(model.dimensions);
        expect(resolved.measures).toEqual(model.measures);
        expect(resolved.metrics).toEqual(model.metrics);
        expect(resolved.filters).toEqual(model.filters);
        expect(resolved.relationships).toEqual(model.relationships);
      });

      it('should handle multiple models with different override patterns', () => {
        const models: Model[] = [
          {
            name: 'model1',
            dimensions: [{ name: 'id', searchable: false }],
            measures: [],
            metrics: [],
            filters: [],
            relationships: [],
          },
          {
            name: 'model2',
            data_source_name: 'custom_source',
            dimensions: [{ name: 'id', searchable: false }],
            measures: [],
            metrics: [],
            filters: [],
            relationships: [],
          },
          {
            name: 'model3',
            database: 'custom_db',
            schema: 'custom_schema',
            dimensions: [{ name: 'id', searchable: false }],
            measures: [],
            metrics: [],
            filters: [],
            relationships: [],
          },
        ];

        const resolved = models.map((m) => resolveModelConfig(m, baseConfig));

        // Model 1: inherits all from global
        expect(resolved[0].data_source_name).toBe('global_postgres');
        expect(resolved[0].database).toBe('global_db');
        expect(resolved[0].schema).toBe('global_schema');

        // Model 2: overrides data_source, inherits others
        expect(resolved[1].data_source_name).toBe('custom_source');
        expect(resolved[1].database).toBe('global_db');
        expect(resolved[1].schema).toBe('global_schema');

        // Model 3: overrides database and schema, inherits data_source
        expect(resolved[2].data_source_name).toBe('global_postgres');
        expect(resolved[2].database).toBe('custom_db');
        expect(resolved[2].schema).toBe('custom_schema');
      });
    });
  });

  describe('parseModelFile', () => {
    it('should parse a single model file', async () => {
      const model = {
        name: 'users',
        description: 'User model',
        data_source_name: 'postgres',
        schema: 'public',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [{ name: 'count' }],
      };

      const filePath = join(testDir, 'users.yml');
      await writeFile(filePath, yaml.dump(model));

      const result = await parseModelFile(filePath);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('users');
      expect(result[0].description).toBe('User model');
      expect(result[0].dimensions).toHaveLength(1);
      expect(result[0].measures).toHaveLength(1);
    });

    it('should parse a multi-model file', async () => {
      const multiModel = {
        models: [
          {
            name: 'users',
            dimensions: [{ name: 'id', searchable: false }],
            measures: [],
          },
          {
            name: 'orders',
            dimensions: [{ name: 'order_id', searchable: false }],
            measures: [{ name: 'total' }],
          },
        ],
      };

      const filePath = join(testDir, 'models.yml');
      await writeFile(filePath, yaml.dump(multiModel));

      const result = await parseModelFile(filePath);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('users');
      expect(result[1].name).toBe('orders');
    });

    it('should throw ModelParsingError for invalid YAML', async () => {
      const filePath = join(testDir, 'invalid.yml');
      await writeFile(filePath, 'invalid: yaml: content: :::');

      await expect(parseModelFile(filePath)).rejects.toThrow(ModelParsingError);
    });

    it('should throw ModelParsingError for invalid model structure', async () => {
      const invalidModel = {
        // Missing required 'name' field
        dimensions: 'not an array',
      };

      const filePath = join(testDir, 'invalid-model.yml');
      await writeFile(filePath, yaml.dump(invalidModel));

      await expect(parseModelFile(filePath)).rejects.toThrow(ModelParsingError);
    });

    it('should throw ModelParsingError for empty file', async () => {
      const filePath = join(testDir, 'empty.yml');
      await writeFile(filePath, '');

      await expect(parseModelFile(filePath)).rejects.toThrow('Invalid YAML structure');
    });

    it('should include file path in error message', async () => {
      const filePath = join(testDir, 'error.yml');
      await writeFile(filePath, 'null');

      try {
        await parseModelFile(filePath);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ModelParsingError);
        expect((error as ModelParsingError).file).toBe(filePath);
        expect((error as ModelParsingError).getDetailedMessage()).toContain(filePath);
      }
    });
  });

  describe('validateModel', () => {
    it('should validate a valid model', () => {
      const model: Model = {
        name: 'valid_model',
        data_source_name: 'postgres',
        schema: 'public',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [{ name: 'count' }],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require model name', () => {
      const model: Model = {
        name: '',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model name is required');
    });

    it('should require at least one dimension or measure', () => {
      const model: Model = {
        name: 'empty_model',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model must have at least one dimension or measure');
    });

    it('should detect duplicate dimension names', () => {
      const model: Model = {
        name: 'test',
        dimensions: [
          { name: 'duplicate', searchable: false },
          { name: 'duplicate', searchable: true },
        ],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate dimension name: duplicate');
    });

    it('should detect duplicate measure names', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [{ name: 'count' }, { name: 'count' }],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate measure name: count');
    });

    it('should detect duplicate metric names', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [
          { name: 'total', expr: 'sum(amount)' },
          { name: 'total', expr: 'count(*)' },
        ],
        filters: [],
        relationships: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate metric name: total');
    });

    it('should require metric expressions', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [{ name: 'empty_metric', expr: '' }],
        filters: [],
        relationships: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Metric empty_metric must have an expression');
    });

    it('should detect duplicate filter names', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [
          { name: 'active', expr: 'status = "active"' },
          { name: 'active', expr: 'deleted_at IS NULL' },
        ],
        relationships: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate filter name: active');
    });

    it('should require filter expressions', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [{ name: 'empty_filter', expr: '' }],
        relationships: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Filter empty_filter must have an expression');
    });

    it('should validate relationship columns', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [
          { name: 'incomplete', source_col: '', ref_col: 'users.id' },
        ],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Relationship incomplete must have source_col and ref_col');
    });

    it('should return multiple errors for multiple issues', () => {
      const model: Model = {
        name: '',
        dimensions: [],
        measures: [],
        metrics: [{ name: 'metric1', expr: '' }],
        filters: [
          { name: 'filter1', expr: 'valid' },
          { name: 'filter1', expr: 'duplicate' },
        ],
        relationships: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
      expect(result.errors).toContain('Model name is required');
      expect(result.errors).toContain('Model must have at least one dimension or measure');
      expect(result.errors).toContain('Metric metric1 must have an expression');
      expect(result.errors).toContain('Duplicate filter name: filter1');
    });
  });

  describe('generateDefaultSQL', () => {
    it('should generate SQL with database and schema', () => {
      const model: Model = {
        name: 'users',
        database: 'analytics',
        schema: 'public',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const sql = generateDefaultSQL(model);

      expect(sql).toBe('SELECT * FROM analytics.public.users');
    });

    it('should generate SQL with only schema', () => {
      const model: Model = {
        name: 'orders',
        schema: 'sales',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const sql = generateDefaultSQL(model);

      expect(sql).toBe('SELECT * FROM sales.orders');
    });

    it('should generate SQL without database or schema', () => {
      const model: Model = {
        name: 'products',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const sql = generateDefaultSQL(model);

      expect(sql).toBe('SELECT * FROM products');
    });
  });

  describe('ModelParsingError', () => {
    it('should format error message with Zod errors', () => {
      const zodError = {
        issues: [
          { path: ['name'], message: 'Required' },
          { path: ['dimensions', 0, 'type'], message: 'Invalid type' },
        ],
      } as any;

      const error = new ModelParsingError('Parse failed', '/path/to/file.yml', zodError);

      const detailed = error.getDetailedMessage();

      expect(detailed).toContain('Parse failed (/path/to/file.yml)');
      expect(detailed).toContain('name: Required');
      expect(detailed).toContain('dimensions.0.type: Invalid type');
    });

    it('should format error message without Zod errors', () => {
      const error = new ModelParsingError('Simple error', '/path/to/file.yml');

      const detailed = error.getDetailedMessage();

      expect(detailed).toBe('Simple error (/path/to/file.yml)');
    });
  });
});