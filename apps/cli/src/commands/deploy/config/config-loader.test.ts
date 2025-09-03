import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusterConfig, ProjectContext } from '../schemas';
import { loadBusterConfig, resolveConfiguration } from './config-loader';

describe('config-loader', () => {
  let testDir: string;
  let testId: string;

  beforeEach(async () => {
    testId = Math.random().toString(36).substring(7);
    testDir = join(tmpdir(), `buster-cli-test-${testId}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('loadBusterConfig', () => {
    describe('when no buster.yml file exists', () => {
      it('should throw error when no config files are found', async () => {
        await expect(loadBusterConfig(testDir)).rejects.toThrow(
          'No buster.yml found in the repository'
        );
      });

      it('should throw error for non-existent path', async () => {
        const nonExistentPath = join(testDir, 'does-not-exist');
        await expect(loadBusterConfig(nonExistentPath)).rejects.toThrow(
          `Path does not exist: ${nonExistentPath}`
        );
      });

      it('should throw error for file instead of directory', async () => {
        const filePath = join(testDir, 'file.txt');
        await writeFile(filePath, 'content');
        await expect(loadBusterConfig(filePath)).rejects.toThrow(
          `Path is not a directory: ${filePath}`
        );
      });
    });

    describe('when single buster.yml exists', () => {
      it('should load a valid buster.yml file', async () => {
        const config: BusterConfig = {
          projects: [
            {
              name: 'test-project',
              data_source: 'postgres',
              database: 'test_db',
              schema: 'public',
            },
          ],
        };

        await writeFile(join(testDir, 'buster.yml'), yaml.dump(config));

        const result = await loadBusterConfig(testDir);
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0].name).toBe('test-project');
        expect(result.projects[0].data_source).toBe('postgres');
      });

      it('should handle buster.yaml (with .yaml extension)', async () => {
        const config: BusterConfig = {
          projects: [
            {
              name: 'yaml-project',
              data_source: 'mysql',
              database: 'yaml_db',
              schema: 'default',
            },
          ],
        };

        await writeFile(join(testDir, 'buster.yaml'), yaml.dump(config));

        const result = await loadBusterConfig(testDir);
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0].name).toBe('yaml-project');
      });

      it('should skip invalid yaml files with warning', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await writeFile(join(testDir, 'buster.yml'), 'invalid: yaml: content:');

        await expect(loadBusterConfig(testDir)).rejects.toThrow(
          'No valid projects found in any buster.yml files'
        );

        expect(consoleSpy).toHaveBeenCalled();
      });

      it('should skip files with invalid schema', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const invalidConfig = {
          projects: [
            {
              // Missing required fields
              name: 'invalid-project',
            },
          ],
        };

        await writeFile(join(testDir, 'buster.yml'), yaml.dump(invalidConfig));

        await expect(loadBusterConfig(testDir)).rejects.toThrow(
          'No valid projects found in any buster.yml files'
        );

        expect(consoleSpy).toHaveBeenCalled();
      });
    });

    describe('when multiple buster.yml files exist in different directories', () => {
      it('should find and merge configs from subdirectories', async () => {
        // Create subdirectories
        const subDir1 = join(testDir, 'project1');
        const subDir2 = join(testDir, 'project2');
        await mkdir(subDir1, { recursive: true });
        await mkdir(subDir2, { recursive: true });

        const config1: BusterConfig = {
          projects: [
            {
              name: 'project1',
              data_source: 'postgres',
              database: 'db1',
              schema: 'public',
            },
          ],
        };

        const config2: BusterConfig = {
          projects: [
            {
              name: 'project2',
              data_source: 'mysql',
              database: 'db2',
              schema: 'default',
            },
          ],
        };

        await writeFile(join(subDir1, 'buster.yml'), yaml.dump(config1));
        await writeFile(join(subDir2, 'buster.yml'), yaml.dump(config2));

        const result = await loadBusterConfig(testDir);
        expect(result.projects).toHaveLength(2);
        expect(result.projects.map((p) => p.name).sort()).toEqual(['project1', 'project2']);
      });

      it('should handle deeply nested directories', async () => {
        const deepPath = join(testDir, 'a', 'b', 'c', 'd');
        await mkdir(deepPath, { recursive: true });

        const config: BusterConfig = {
          projects: [
            {
              name: 'deep-project',
              data_source: 'bigquery',
              database: 'deep_db',
              schema: 'dataset',
            },
          ],
        };

        await writeFile(join(deepPath, 'buster.yml'), yaml.dump(config));

        const result = await loadBusterConfig(testDir);
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0].name).toBe('deep-project');
      });

      it('should skip common directories like node_modules', async () => {
        const nodeModulesDir = join(testDir, 'node_modules');
        const gitDir = join(testDir, '.git');
        const distDir = join(testDir, 'dist');

        await mkdir(nodeModulesDir, { recursive: true });
        await mkdir(gitDir, { recursive: true });
        await mkdir(distDir, { recursive: true });

        // Add configs in directories that should be skipped
        const ignoredConfig: BusterConfig = {
          projects: [
            {
              name: 'ignored-project',
              data_source: 'postgres',
              database: 'ignored_db',
              schema: 'public',
            },
          ],
        };

        await writeFile(join(nodeModulesDir, 'buster.yml'), yaml.dump(ignoredConfig));
        await writeFile(join(gitDir, 'buster.yml'), yaml.dump(ignoredConfig));
        await writeFile(join(distDir, 'buster.yml'), yaml.dump(ignoredConfig));

        await expect(loadBusterConfig(testDir)).rejects.toThrow(
          'No buster.yml found in the repository'
        );
      });
    });

    describe('when handling duplicate projects', () => {
      it('should warn about exact duplicates and keep first occurrence', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const subDir1 = join(testDir, 'dir1');
        const subDir2 = join(testDir, 'dir2');
        await mkdir(subDir1, { recursive: true });
        await mkdir(subDir2, { recursive: true });

        const duplicateProject: ProjectContext = {
          name: 'duplicate-project',
          data_source: 'postgres',
          database: 'same_db',
          schema: 'public',
        };

        const config1: BusterConfig = {
          projects: [duplicateProject],
        };

        const config2: BusterConfig = {
          projects: [{ ...duplicateProject }], // Same project
        };

        await writeFile(join(subDir1, 'buster.yml'), yaml.dump(config1));
        await writeFile(join(subDir2, 'buster.yml'), yaml.dump(config2));

        const result = await loadBusterConfig(testDir);

        // Should only have one instance of the duplicate project
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0].name).toBe('duplicate-project');

        // Should have warned about the duplicate
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicate project'));
      });

      it('should allow projects with same name but different data sources', async () => {
        const subDir1 = join(testDir, 'dir1');
        const subDir2 = join(testDir, 'dir2');
        await mkdir(subDir1, { recursive: true });
        await mkdir(subDir2, { recursive: true });

        const config1: BusterConfig = {
          projects: [
            {
              name: 'my-project',
              data_source: 'postgres',
              database: 'pg_db',
              schema: 'public',
            },
          ],
        };

        const config2: BusterConfig = {
          projects: [
            {
              name: 'my-project',
              data_source: 'mysql', // Different data source
              database: 'mysql_db',
              schema: 'default',
            },
          ],
        };

        await writeFile(join(subDir1, 'buster.yml'), yaml.dump(config1));
        await writeFile(join(subDir2, 'buster.yml'), yaml.dump(config2));

        const result = await loadBusterConfig(testDir);

        // Both projects should be included since they have different data sources
        expect(result.projects).toHaveLength(2);
        expect(result.projects.map((p) => p.data_source).sort()).toEqual(['mysql', 'postgres']);
      });

      it('should handle multiple projects in same file with some duplicates in other files', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const subDir1 = join(testDir, 'dir1');
        const subDir2 = join(testDir, 'dir2');
        await mkdir(subDir1, { recursive: true });
        await mkdir(subDir2, { recursive: true });

        const config1: BusterConfig = {
          projects: [
            {
              name: 'project-a',
              data_source: 'postgres',
              database: 'db_a',
              schema: 'public',
            },
            {
              name: 'project-b',
              data_source: 'mysql',
              database: 'db_b',
              schema: 'default',
            },
          ],
        };

        const config2: BusterConfig = {
          projects: [
            {
              name: 'project-b', // Duplicate
              data_source: 'mysql',
              database: 'db_b',
              schema: 'default',
            },
            {
              name: 'project-c', // New project
              data_source: 'bigquery',
              database: 'db_c',
              schema: 'dataset',
            },
          ],
        };

        await writeFile(join(subDir1, 'buster.yml'), yaml.dump(config1));
        await writeFile(join(subDir2, 'buster.yml'), yaml.dump(config2));

        const result = await loadBusterConfig(testDir);

        // Should have 3 unique projects
        expect(result.projects).toHaveLength(3);
        expect(result.projects.map((p) => p.name).sort()).toEqual([
          'project-a',
          'project-b',
          'project-c',
        ]);

        // Should warn about the duplicate
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Duplicate project 'project-b'")
        );
      });
    });

    describe('when handling edge cases', () => {
      it('should handle empty projects array', async () => {
        const config: BusterConfig = {
          projects: [],
        };

        await writeFile(join(testDir, 'buster.yml'), yaml.dump(config));

        await expect(loadBusterConfig(testDir)).rejects.toThrow(
          'No valid projects found in any buster.yml files'
        );
      });

      it('should provide informative console output', async () => {
        const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

        const subDir = join(testDir, 'subdir');
        await mkdir(subDir, { recursive: true });

        const config1: BusterConfig = {
          projects: [
            {
              name: 'project1',
              data_source: 'postgres',
              database: 'db',
              schema: 'public',
            },
          ],
        };

        const config2: BusterConfig = {
          projects: [
            {
              name: 'project2',
              data_source: 'mysql',
              database: 'db',
              schema: 'default',
            },
          ],
        };

        await writeFile(join(testDir, 'buster.yml'), yaml.dump(config1));
        await writeFile(join(subDir, 'buster.yml'), yaml.dump(config2));

        await loadBusterConfig(testDir);

        // Should log search message
        expect(consoleInfoSpy).toHaveBeenCalledWith(
          expect.stringContaining('Searching for buster.yml files')
        );

        // Should log found files count
        expect(consoleInfoSpy).toHaveBeenCalledWith(
          expect.stringContaining('Found 2 buster.yml file(s)')
        );

        // Should log unique projects count
        expect(consoleInfoSpy).toHaveBeenCalledWith(
          expect.stringContaining('Found 2 unique project(s)')
        );
      });

      it('should handle multiple files where some have no valid projects', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const subDir1 = join(testDir, 'valid');
        const subDir2 = join(testDir, 'invalid');
        await mkdir(subDir1, { recursive: true });
        await mkdir(subDir2, { recursive: true });

        const validConfig: BusterConfig = {
          projects: [
            {
              name: 'valid-project',
              data_source: 'postgres',
              database: 'db',
              schema: 'public',
            },
          ],
        };

        const invalidConfig = {
          projects: [
            {
              // Missing required fields
              name: 'invalid',
            },
          ],
        };

        await writeFile(join(subDir1, 'buster.yml'), yaml.dump(validConfig));
        await writeFile(join(subDir2, 'buster.yml'), yaml.dump(invalidConfig));

        const result = await loadBusterConfig(testDir);

        // Should only have the valid project
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0].name).toBe('valid-project');

        // Should have warned about invalid config
        expect(consoleSpy).toHaveBeenCalled();
      });

      it('should handle complex project structures with mixed patterns', async () => {
        // Create a complex directory structure
        const projectA = join(testDir, 'services', 'api');
        const projectB = join(testDir, 'services', 'web');
        const projectC = join(testDir, 'data', 'analytics');

        await mkdir(projectA, { recursive: true });
        await mkdir(projectB, { recursive: true });
        await mkdir(projectC, { recursive: true });

        const apiConfig: BusterConfig = {
          projects: [
            {
              name: 'api-postgres',
              data_source: 'postgres',
              database: 'api_db',
              schema: 'public',
              include: ['models/**/*.yml'],
              exclude: ['**/test/**'],
            },
            {
              name: 'api-redis',
              data_source: 'redis',
              database: 'cache',
              schema: 'default',
            },
          ],
        };

        const webConfig: BusterConfig = {
          projects: [
            {
              name: 'web-analytics',
              data_source: 'bigquery',
              database: 'analytics',
              schema: 'web_events',
            },
          ],
        };

        const analyticsConfig: BusterConfig = {
          projects: [
            {
              name: 'data-warehouse',
              data_source: 'snowflake',
              database: 'warehouse',
              schema: 'prod',
              include: ['**/*.sql', '**/*.yml'],
            },
            {
              name: 'api-postgres', // Duplicate from api config
              data_source: 'postgres',
              database: 'api_db',
              schema: 'public',
              include: ['models/**/*.yml'],
              exclude: ['**/test/**'],
            },
          ],
        };

        await writeFile(join(projectA, 'buster.yml'), yaml.dump(apiConfig));
        await writeFile(join(projectB, 'buster.yml'), yaml.dump(webConfig));
        await writeFile(join(projectC, 'buster.yml'), yaml.dump(analyticsConfig));

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const result = await loadBusterConfig(testDir);

        // Should have 4 unique projects (api-postgres is duplicate)
        expect(result.projects).toHaveLength(4);

        const projectNames = result.projects.map((p) => p.name).sort();
        expect(projectNames).toEqual([
          'api-postgres',
          'api-redis',
          'data-warehouse',
          'web-analytics',
        ]);

        // Should have warned about duplicate
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Duplicate project 'api-postgres'")
        );
      });
    });
  });

  describe('resolveConfiguration', () => {
    const createTestConfig = (projects: ProjectContext[]): BusterConfig => ({
      projects,
    });

    it('should resolve configuration for first project when no name specified', () => {
      const config = createTestConfig([
        {
          name: 'first-project',
          data_source: 'postgres',
          database: 'first_db',
          schema: 'public',
        },
        {
          name: 'second-project',
          data_source: 'mysql',
          database: 'second_db',
          schema: 'default',
        },
      ]);

      const resolved = resolveConfiguration(config, { dryRun: false, verbose: false });

      expect(resolved.data_source_name).toBe('postgres');
      expect(resolved.database).toBe('first_db');
      expect(resolved.schema).toBe('public');
    });

    it('should resolve configuration for named project', () => {
      const config = createTestConfig([
        {
          name: 'first-project',
          data_source: 'postgres',
          database: 'first_db',
          schema: 'public',
        },
        {
          name: 'second-project',
          data_source: 'mysql',
          database: 'second_db',
          schema: 'default',
        },
      ]);

      const resolved = resolveConfiguration(
        config,
        { dryRun: false, verbose: false },
        'second-project'
      );

      expect(resolved.data_source_name).toBe('mysql');
      expect(resolved.database).toBe('second_db');
      expect(resolved.schema).toBe('default');
    });

    it('should throw error when specified project not found', () => {
      const config = createTestConfig([
        {
          name: 'existing-project',
          data_source: 'postgres',
          database: 'db',
          schema: 'public',
        },
      ]);

      expect(() =>
        resolveConfiguration(config, { dryRun: false, verbose: false }, 'non-existent')
      ).toThrow("Project 'non-existent' not found in buster.yml");
    });

    it('should throw error when no projects defined', () => {
      const config = createTestConfig([]);

      expect(() => resolveConfiguration(config, { dryRun: false, verbose: false })).toThrow(
        'No projects defined in buster.yml'
      );
    });

    it('should handle include and exclude patterns', () => {
      const config = createTestConfig([
        {
          name: 'project-with-patterns',
          data_source: 'postgres',
          database: 'db',
          schema: 'public',
          include: ['models/**/*.yml', 'metrics/**/*.yml'],
          exclude: ['**/test/**', '**/temp/**'],
        },
      ]);

      const resolved = resolveConfiguration(config, { dryRun: false, verbose: false });

      expect(resolved.include).toEqual(['models/**/*.yml', 'metrics/**/*.yml']);
      expect(resolved.exclude).toEqual(['**/test/**', '**/temp/**']);
    });

    it('should use default include patterns when not specified', () => {
      const config = createTestConfig([
        {
          name: 'project-without-patterns',
          data_source: 'postgres',
          database: 'db',
          schema: 'public',
        },
      ]);

      const resolved = resolveConfiguration(config, { dryRun: false, verbose: false });

      expect(resolved.include).toEqual(['**/*.yml', '**/*.yaml']);
      expect(resolved.exclude).toEqual([]);
    });
  });
});
