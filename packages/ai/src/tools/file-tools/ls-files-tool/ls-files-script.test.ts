import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const exec = promisify(child_process.exec);

describe('ls-files-script', () => {
  const scriptPath = path.join(__dirname, 'ls-files-script.ts');
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ls-files-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  async function runScript(args: string[]): Promise<{ stdout: string; stderr: string }> {
    // Properly escape arguments for shell
    const escapedArgs = args.map((arg) => {
      // If it contains special characters, wrap in single quotes
      if (arg.includes(' ') || arg.includes('"') || arg.includes('[') || arg.includes(']')) {
        return `'${arg.replace(/'/g, "'\"'\"'")}'`;
      }
      return arg;
    });
    const { stdout, stderr } = await exec(`npx tsx ${scriptPath} ${escapedArgs.join(' ')}`);
    return { stdout, stderr };
  }

  describe('functional tests', () => {
    it.skipIf(process.platform === 'win32')(
      'should list current directory when no arguments provided',
      async () => {
        // Create some test files and directories
        await fs.writeFile(path.join(tempDir, 'file1.txt'), 'content1');
        await fs.writeFile(path.join(tempDir, 'file2.txt'), 'content2');
        await fs.mkdir(path.join(tempDir, 'subdir'));

        // Change to temp directory
        const originalCwd = process.cwd();
        process.chdir(tempDir);

        try {
          const { stdout } = await runScript([]);
          const results = JSON.parse(stdout);

          expect(results).toHaveLength(1);
          expect(results[0].success).toBe(true);
          expect(results[0].path).toBe('.');
          expect(results[0].entries).toBeDefined();

          const names = results[0].entries.map((e: any) => e.name).sort();
          expect(names).toContain('file1.txt');
          expect(names).toContain('file2.txt');
          expect(names).toContain('subdir');
        } finally {
          process.chdir(originalCwd);
        }
      }
    );

    it.skipIf(process.platform === 'win32')('should list specific directory', async () => {
      // Create test structure
      const subDir = path.join(tempDir, 'testdir');
      await fs.mkdir(subDir);
      await fs.writeFile(path.join(subDir, 'test1.txt'), 'test content');
      await fs.writeFile(path.join(subDir, 'test2.txt'), 'test content');

      const { stdout } = await runScript([subDir]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].path).toBe(subDir);
      expect(results[0].entries).toHaveLength(2);
      expect(results[0].entries[0].type).toBe('file');
      expect(results[0].entries[1].type).toBe('file');
    });

    it.skipIf(process.platform === 'win32')('should handle multiple paths', async () => {
      // Create test directories
      const dir1 = path.join(tempDir, 'dir1');
      const dir2 = path.join(tempDir, 'dir2');
      await fs.mkdir(dir1);
      await fs.mkdir(dir2);
      await fs.writeFile(path.join(dir1, 'file1.txt'), 'content');
      await fs.writeFile(path.join(dir2, 'file2.txt'), 'content');

      const { stdout } = await runScript([dir1, dir2]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].path).toBe(dir1);
      expect(results[1].success).toBe(true);
      expect(results[1].path).toBe(dir2);
    });

    it.skipIf(process.platform === 'win32')('should parse flags correctly', async () => {
      // Create hidden file
      await fs.writeFile(path.join(tempDir, '.hidden'), 'hidden content');
      await fs.writeFile(path.join(tempDir, 'visible.txt'), 'visible content');

      const { stdout } = await runScript(['-a', tempDir]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      const names = results[0].entries.map((e: any) => e.name);
      expect(names).toContain('.hidden');
      expect(names).toContain('visible.txt');
    });

    it.skipIf(process.platform === 'win32')(
      'should handle detailed output with -l flag',
      async () => {
        // Create test file
        await fs.writeFile(path.join(tempDir, 'test.txt'), 'test content');

        const { stdout } = await runScript(['-l', tempDir]);
        const results = JSON.parse(stdout);

        expect(results[0].success).toBe(true);
        expect(results[0].entries).toBeDefined();

        const fileEntry = results[0].entries.find((e: any) => e.name === 'test.txt');
        expect(fileEntry).toBeDefined();
        expect(fileEntry.permissions).toBeDefined();
        expect(fileEntry.size).toBeDefined();
        expect(fileEntry.owner).toBeDefined();
        expect(fileEntry.group).toBeDefined();
        expect(fileEntry.modified).toBeDefined();
      }
    );

    it.skipIf(process.platform === 'win32')('should identify file types correctly', async () => {
      // Create different types
      await fs.writeFile(path.join(tempDir, 'regular.txt'), 'content');
      await fs.mkdir(path.join(tempDir, 'directory'));

      // Create a symlink (if supported)
      try {
        await fs.symlink(path.join(tempDir, 'regular.txt'), path.join(tempDir, 'symlink.txt'));
      } catch {
        // Symlinks might not be supported on all systems
      }

      const { stdout } = await runScript([tempDir]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);

      const regularFile = results[0].entries.find((e: any) => e.name === 'regular.txt');
      expect(regularFile?.type).toBe('file');

      const directory = results[0].entries.find((e: any) => e.name === 'directory');
      expect(directory?.type).toBe('directory');
    });

    it('should handle path not found error', async () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent');

      const { stdout } = await runScript([nonExistentPath]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        success: false,
        path: nonExistentPath,
        error: 'Path not found',
      });
    });

    it('should handle Windows platform', async () => {
      if (process.platform !== 'win32') {
        return;
      }

      const { stdout } = await runScript([tempDir]);
      const results = JSON.parse(stdout);

      expect(results[0]).toEqual({
        success: false,
        path: tempDir,
        error: 'ls command not available on Windows platform',
      });
    });

    it.skipIf(process.platform === 'win32')('should handle relative paths', async () => {
      const originalCwd = process.cwd();
      try {
        // Change to temp directory
        process.chdir(tempDir);

        // Create a subdirectory with files
        await fs.mkdir('subdir');
        await fs.writeFile('subdir/file.txt', 'content');

        const { stdout } = await runScript(['subdir']);
        const results = JSON.parse(stdout);

        expect(results[0].success).toBe(true);
        expect(results[0].path).toBe('subdir');
        expect(results[0].entries).toHaveLength(1);
        expect(results[0].entries[0].name).toBe('file.txt');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it.skipIf(process.platform === 'win32')('should handle combined flags', async () => {
      // Create hidden files and directories
      await fs.writeFile(path.join(tempDir, '.hidden.txt'), 'hidden');
      await fs.writeFile(path.join(tempDir, 'visible.txt'), 'visible');
      await fs.mkdir(path.join(tempDir, '.hiddendir'));

      const { stdout } = await runScript(['-la', tempDir]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      expect(results[0].entries).toBeDefined();

      // Should have detailed output with all files including hidden
      const hiddenFile = results[0].entries.find((e: any) => e.name === '.hidden.txt');
      expect(hiddenFile).toBeDefined();
      expect(hiddenFile.permissions).toBeDefined();

      const hiddenDir = results[0].entries.find((e: any) => e.name === '.hiddendir');
      expect(hiddenDir).toBeDefined();
      expect(hiddenDir.type).toBe('directory');
    });

    it.skipIf(process.platform === 'win32')('should handle empty directories', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      await fs.mkdir(emptyDir);

      const { stdout } = await runScript([emptyDir]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      expect(results[0].entries).toEqual([]);
    });

    it.skipIf(process.platform === 'win32')(
      'should handle special characters in filenames',
      async () => {
        // Create files with special characters
        await fs.writeFile(path.join(tempDir, 'file with spaces.txt'), 'content');
        await fs.writeFile(path.join(tempDir, 'file-with-dashes.txt'), 'content');
        await fs.writeFile(path.join(tempDir, 'file_with_underscores.txt'), 'content');

        const { stdout } = await runScript([tempDir]);
        const results = JSON.parse(stdout);

        expect(results[0].success).toBe(true);
        const names = results[0].entries.map((e: any) => e.name);
        expect(names).toContain('file with spaces.txt');
        expect(names).toContain('file-with-dashes.txt');
        expect(names).toContain('file_with_underscores.txt');
      }
    );

    it.skipIf(process.platform === 'win32')(
      'should handle permission denied gracefully',
      async () => {
        // Create a directory with restricted permissions
        const restrictedDir = path.join(tempDir, 'restricted');
        await fs.mkdir(restrictedDir);

        try {
          // Try to restrict permissions (may not work on all systems)
          await fs.chmod(restrictedDir, 0o000);

          const { stdout } = await runScript([restrictedDir]);
          const results = JSON.parse(stdout);

          expect(results[0].success).toBe(false);
          expect(results[0].error).toBeTruthy();
        } finally {
          // Restore permissions for cleanup
          await fs.chmod(restrictedDir, 0o755);
        }
      }
    );
  });
});
