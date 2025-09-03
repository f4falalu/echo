import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusterConfig, DeployOptions, DeployRequest, DeployResponse, Model } from './schemas';
import { deployHandler, validateDeployOptions } from './deploy-handler';

// Mock the deployment strategies module
vi.mock('./deployment/strategies', () => ({
  createAuthenticatedDeployer: vi.fn(),
  createDryRunDeployer: vi.fn(),
}));

// Mock console methods
const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('deploy-handler', () => {
  let testDir: string;

  beforeEach(async () => {
    const testId = Math.random().toString(36).substring(7);
    testDir = join(tmpdir(), `buster-cli-test-${testId}`);
    await mkdir(testDir, { recursive: true });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('configuration cascading integration tests', () => {
    it('should cascade global config to models without config', async () => {
      // Create buster.yml with global config
      const busterConfig: BusterConfig = {
        projects: [
          {
            name: 'test-project',
            data_source: 'global_postgres',
            database: 'global_db',
            schema: 'global_schema',
          },
        ],
      };
      await writeFile(join(testDir, 'buster.yml'), yaml.dump(busterConfig));

      // Create model file without data_source, database, or schema
      await mkdir(join(testDir, 'models'), { recursive: true });
      const model = {
        name: 'users',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [{ name: 'count' }],
      };
      await writeFile(join(testDir, 'models', 'users.yml'), yaml.dump(model));

      // Mock the deployment function to capture the request
      let capturedRequest: DeployRequest | undefined;
      const mockDeploy = vi.fn(async (request: DeployRequest) => {
        capturedRequest = request;
        return {
          success: request.models.map((m) => ({ model_name: m.name, data_source: m.data_source_name })),
          updated: [],
          no_change: [],
          failures: [],
        } as DeployResponse;
      });

      const { createDryRunDeployer } = await import('./deployment/strategies');
      (createDryRunDeployer as any).mockReturnValue(mockDeploy);

      // Run the deploy handler
      const options: DeployOptions = {
        path: testDir,
        dryRun: true,
        verbose: false,
      };

      await deployHandler(options);

      // Verify the model inherited the global config
      expect(capturedRequest).toBeDefined();
      expect(capturedRequest?.models).toHaveLength(1);
      expect(capturedRequest?.models[0].data_source_name).toBe('global_postgres');
      expect(capturedRequest?.models[0].database).toBe('global_db');
      expect(capturedRequest?.models[0].schema).toBe('global_schema');
    });

    it('should allow models to override global config', async () => {
      // Create buster.yml with global config
      const busterConfig: BusterConfig = {
        projects: [
          {
            name: 'test-project',
            data_source: 'global_postgres',
            database: 'global_db',
            schema: 'global_schema',
          },
        ],
      };
      await writeFile(join(testDir, 'buster.yml'), yaml.dump(busterConfig));

      // Create model file that overrides some config
      await mkdir(join(testDir, 'models'), { recursive: true });
      const model = {
        name: 'orders',
        data_source_name: 'model_mysql',  // Override
        schema: 'model_sales',  // Override
        // database not specified, should inherit from global
        dimensions: [{ name: 'order_id', searchable: false }],
        measures: [{ name: 'total' }],
      };
      await writeFile(join(testDir, 'models', 'orders.yml'), yaml.dump(model));

      // Mock the deployment function
      let capturedRequest: DeployRequest | undefined;
      const mockDeploy = vi.fn(async (request: DeployRequest) => {
        capturedRequest = request;
        return {
          success: request.models.map((m) => ({ model_name: m.name, data_source: m.data_source_name })),
          updated: [],
          no_change: [],
          failures: [],
        } as DeployResponse;
      });

      const { createDryRunDeployer } = await import('./deployment/strategies');
      (createDryRunDeployer as any).mockReturnValue(mockDeploy);

      // Run the deploy handler
      const options: DeployOptions = {
        path: testDir,
        dryRun: true,
        verbose: false,
      };

      await deployHandler(options);

      // Verify the model overrides worked correctly
      expect(capturedRequest).toBeDefined();
      expect(capturedRequest?.models).toHaveLength(1);
      expect(capturedRequest?.models[0].data_source_name).toBe('model_mysql');  // Overridden
      expect(capturedRequest?.models[0].database).toBe('global_db');  // Inherited
      expect(capturedRequest?.models[0].schema).toBe('model_sales');  // Overridden
    });

    it('should handle multiple models with different override patterns', async () => {
      // Create buster.yml with global config
      const busterConfig: BusterConfig = {
        projects: [
          {
            name: 'test-project',
            data_source: 'global_postgres',
            database: 'global_db',
            schema: 'global_schema',
          },
        ],
      };
      await writeFile(join(testDir, 'buster.yml'), yaml.dump(busterConfig));

      // Create models directory
      await mkdir(join(testDir, 'models'), { recursive: true });

      // Model 1: No overrides, inherits all
      const model1 = {
        name: 'users',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [{ name: 'count' }],
      };
      await writeFile(join(testDir, 'models', 'users.yml'), yaml.dump(model1));

      // Model 2: Override data_source only
      const model2 = {
        name: 'analytics',
        data_source_name: 'bigquery',
        dimensions: [{ name: 'event_id', searchable: false }],
        measures: [{ name: 'events' }],
      };
      await writeFile(join(testDir, 'models', 'analytics.yml'), yaml.dump(model2));

      // Model 3: Override all fields
      const model3 = {
        name: 'external',
        data_source_name: 'snowflake',
        database: 'warehouse',
        schema: 'external_data',
        dimensions: [{ name: 'external_id', searchable: false }],
        measures: [],
      };
      await writeFile(join(testDir, 'models', 'external.yml'), yaml.dump(model3));

      // Mock the deployment function
      let capturedRequest: DeployRequest | undefined;
      const mockDeploy = vi.fn(async (request: DeployRequest) => {
        capturedRequest = request;
        return {
          success: request.models.map((m) => ({ model_name: m.name, data_source: m.data_source_name })),
          updated: [],
          no_change: [],
          failures: [],
        } as DeployResponse;
      });

      const { createDryRunDeployer } = await import('./deployment/strategies');
      (createDryRunDeployer as any).mockReturnValue(mockDeploy);

      // Run the deploy handler
      const options: DeployOptions = {
        path: testDir,
        dryRun: true,
        verbose: false,
      };

      await deployHandler(options);

      // Verify all models have correct config
      expect(capturedRequest).toBeDefined();
      expect(capturedRequest?.models).toHaveLength(3);

      // Model 1: All inherited
      const users = capturedRequest?.models.find((m) => m.name === 'users');
      expect(users?.data_source_name).toBe('global_postgres');
      expect(users?.database).toBe('global_db');
      expect(users?.schema).toBe('global_schema');

      // Model 2: data_source overridden, others inherited
      const analytics = capturedRequest?.models.find((m) => m.name === 'analytics');
      expect(analytics?.data_source_name).toBe('bigquery');
      expect(analytics?.database).toBe('global_db');
      expect(analytics?.schema).toBe('global_schema');

      // Model 3: All overridden
      const external = capturedRequest?.models.find((m) => m.name === 'external');
      expect(external?.data_source_name).toBe('snowflake');
      expect(external?.database).toBe('warehouse');
      expect(external?.schema).toBe('external_data');
    });

    it('should handle multi-model files with cascading', async () => {
      // Create buster.yml with global config
      const busterConfig: BusterConfig = {
        projects: [
          {
            name: 'test-project',
            data_source: 'global_postgres',
            database: 'global_db',
            schema: 'global_schema',
          },
        ],
      };
      await writeFile(join(testDir, 'buster.yml'), yaml.dump(busterConfig));

      // Create multi-model file
      await mkdir(join(testDir, 'models'), { recursive: true });
      const multiModel = {
        models: [
          {
            name: 'model1',
            dimensions: [{ name: 'id', searchable: false }],
          },
          {
            name: 'model2',
            data_source_name: 'custom_source',
            dimensions: [{ name: 'id', searchable: false }],
          },
          {
            name: 'model3',
            schema: 'custom_schema',
            dimensions: [{ name: 'id', searchable: false }],
          },
        ],
      };
      await writeFile(join(testDir, 'models', 'models.yml'), yaml.dump(multiModel));

      // Mock the deployment function
      let capturedRequest: DeployRequest | undefined;
      const mockDeploy = vi.fn(async (request: DeployRequest) => {
        capturedRequest = request;
        return {
          success: request.models.map((m) => ({ model_name: m.name, data_source: m.data_source_name })),
          updated: [],
          no_change: [],
          failures: [],
        } as DeployResponse;
      });

      const { createDryRunDeployer } = await import('./deployment/strategies');
      (createDryRunDeployer as any).mockReturnValue(mockDeploy);

      // Run the deploy handler
      const options: DeployOptions = {
        path: testDir,
        dryRun: true,
        verbose: false,
      };

      await deployHandler(options);

      // Verify cascading worked for all models in the file
      expect(capturedRequest).toBeDefined();
      expect(capturedRequest?.models).toHaveLength(3);

      const model1 = capturedRequest?.models.find((m) => m.name === 'model1');
      expect(model1?.data_source_name).toBe('global_postgres');
      expect(model1?.schema).toBe('global_schema');

      const model2 = capturedRequest?.models.find((m) => m.name === 'model2');
      expect(model2?.data_source_name).toBe('custom_source');
      expect(model2?.schema).toBe('global_schema');

      const model3 = capturedRequest?.models.find((m) => m.name === 'model3');
      expect(model3?.data_source_name).toBe('global_postgres');
      expect(model3?.schema).toBe('custom_schema');
    });

    it('should handle multiple projects with different configs', async () => {
      // Create buster.yml with multiple projects
      const busterConfig: BusterConfig = {
        projects: [
          {
            name: 'postgres-project',
            data_source: 'postgres',
            database: 'pg_db',
            schema: 'public',
          },
          {
            name: 'bigquery-project',
            data_source: 'bigquery',
            database: 'analytics',
            schema: 'events',
          },
        ],
      };
      await writeFile(join(testDir, 'buster.yml'), yaml.dump(busterConfig));

      // Create model file
      await mkdir(join(testDir, 'models'), { recursive: true });
      const model = {
        name: 'shared_model',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [{ name: 'count' }],
      };
      await writeFile(join(testDir, 'models', 'shared.yml'), yaml.dump(model));

      // Mock the deployment function
      const capturedRequests: DeployRequest[] = [];
      const mockDeploy = vi.fn(async (request: DeployRequest) => {
        capturedRequests.push(request);
        return {
          success: request.models.map((m) => ({ model_name: m.name, data_source: m.data_source_name })),
          updated: [],
          no_change: [],
          failures: [],
        } as DeployResponse;
      });

      const { createDryRunDeployer } = await import('./deployment/strategies');
      (createDryRunDeployer as any).mockReturnValue(mockDeploy);

      // Run the deploy handler
      const options: DeployOptions = {
        path: testDir,
        dryRun: true,
        verbose: false,
      };

      await deployHandler(options);

      // Each project should have deployed the model with its own config
      expect(capturedRequests).toHaveLength(2);

      // First project deployment
      expect(capturedRequests[0].models[0].data_source_name).toBe('postgres');
      expect(capturedRequests[0].models[0].database).toBe('pg_db');
      expect(capturedRequests[0].models[0].schema).toBe('public');

      // Second project deployment
      expect(capturedRequests[1].models[0].data_source_name).toBe('bigquery');
      expect(capturedRequests[1].models[0].database).toBe('analytics');
      expect(capturedRequests[1].models[0].schema).toBe('events');
    });
  });

  describe('validateDeployOptions', () => {
    it('should validate valid options', () => {
      const options: DeployOptions = {
        dryRun: false,
        verbose: true,
      };

      const result = validateDeployOptions(options);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate when path exists', () => {
      const options: DeployOptions = {
        path: testDir,
        dryRun: false,
        verbose: false,
      };

      const result = validateDeployOptions(options);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when path does not exist', () => {
      const options: DeployOptions = {
        path: '/non/existent/path',
        dryRun: false,
        verbose: false,
      };

      const result = validateDeployOptions(options);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Path does not exist: /non/existent/path');
    });
  });

  describe('error handling', () => {
    it('should handle missing buster.yml gracefully', async () => {
      const options: DeployOptions = {
        path: testDir,
        dryRun: true,
        verbose: false,
      };

      await expect(deployHandler(options)).rejects.toThrow('No buster.yml found');
    });

    it('should handle invalid model files gracefully', async () => {
      // Create buster.yml
      const busterConfig: BusterConfig = {
        projects: [
          {
            name: 'test-project',
            data_source: 'postgres',
            database: 'db',
            schema: 'public',
          },
        ],
      };
      await writeFile(join(testDir, 'buster.yml'), yaml.dump(busterConfig));

      // Create invalid model file
      await mkdir(join(testDir, 'models'), { recursive: true });
      await writeFile(join(testDir, 'models', 'invalid.yml'), 'invalid: yaml: content: :::');

      // Mock the deployment function
      const mockDeploy = vi.fn(async () => ({
        success: [],
        updated: [],
        no_change: [],
        failures: [],
      }));

      const { createDryRunDeployer } = await import('./deployment/strategies');
      (createDryRunDeployer as any).mockReturnValue(mockDeploy);

      const options: DeployOptions = {
        path: testDir,
        dryRun: true,
        verbose: false,
      };

      const result = await deployHandler(options);

      // Should handle the error gracefully
      expect(result.failures.length).toBeGreaterThan(0);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle deployment failures gracefully', async () => {
      // Create buster.yml
      const busterConfig: BusterConfig = {
        projects: [
          {
            name: 'test-project',
            data_source: 'postgres',
            database: 'db',
            schema: 'public',
          },
        ],
      };
      await writeFile(join(testDir, 'buster.yml'), yaml.dump(busterConfig));

      // Create valid model
      await mkdir(join(testDir, 'models'), { recursive: true });
      const model = {
        name: 'users',
        dimensions: [{ name: 'id', searchable: false }],
      };
      await writeFile(join(testDir, 'models', 'users.yml'), yaml.dump(model));

      // Mock deployment to fail
      const mockDeploy = vi.fn(async () => {
        throw new Error('Deployment failed: Network error');
      });

      const { createDryRunDeployer } = await import('./deployment/strategies');
      (createDryRunDeployer as any).mockReturnValue(mockDeploy);

      const options: DeployOptions = {
        path: testDir,
        dryRun: true,
        verbose: false,
      };

      const result = await deployHandler(options);

      // Should handle the error and return failure result
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].errors[0]).toContain('Deployment error: Deployment failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Deployment failed'));
    });
  });
});