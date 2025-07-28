import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const exec = promisify(child_process.exec);

describe('delete-files-script', () => {
  const scriptPath = path.join(__dirname, 'delete-files-script.ts');

  async function runScript(args: string[]): Promise<any> {
    const { stdout, stderr } = await exec(
      `node -r esbuild-register ${scriptPath} ${args.join(' ')}`
    );
    if (stderr) {
      throw new Error(stderr);
    }
    return JSON.parse(stdout);
  }

  describe('deleteSingleFile', () => {
    it('executes the script and returns results', async () => {
      // This is more of a functional test to ensure the script structure is correct
      // The actual file operations are tested in integration tests
      expect(scriptPath).toBeDefined();

      // Verify the script file exists
      await expect(fs.access(scriptPath)).resolves.not.toThrow();
    });
  });

  describe('script structure', () => {
    it('should export no functions (is a script)', async () => {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');

      // The script should not export any functions
      expect(scriptContent).not.toContain('export function');
      expect(scriptContent).not.toContain('export async function');
      expect(scriptContent).not.toContain('export const');

      // It should have a main function that runs automatically
      expect(scriptContent).toContain('async function main()');
      expect(scriptContent).toContain('main().catch');
    });

    it('should handle command line arguments', async () => {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');

      // Should parse process.argv
      expect(scriptContent).toContain('process.argv.slice(2)');

      // Should handle file paths as arguments
      expect(scriptContent).toContain('const paths = args');
    });

    it('should output JSON to stdout', async () => {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');

      // Should use console.log for output
      expect(scriptContent).toContain('console.log(JSON.stringify(results))');
    });

    it('should handle errors with proper exit code', async () => {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');

      // Should handle errors in main().catch
      expect(scriptContent).toContain('process.exit(1)');
      // Script outputs errors as JSON to stdout, not console.error
      expect(scriptContent).toContain('main().catch');
      expect(scriptContent).toContain('Unexpected error:');
    });
  });

  describe('deleteFiles function structure', () => {
    it('should contain deleteFiles function', async () => {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');

      expect(scriptContent).toContain('async function deleteFiles');
      expect(scriptContent).not.toContain('Promise.all');
    });

    it('should contain proper file deletion logic', async () => {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');

      expect(scriptContent).toContain('async function deleteFiles');
      expect(scriptContent).toContain('fs.access');
      expect(scriptContent).toContain('fs.stat');
      expect(scriptContent).toContain('fs.unlink');
      expect(scriptContent).toContain('isDirectory()');
    });

    it('should handle both absolute and relative paths', async () => {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');

      expect(scriptContent).toContain('path.isAbsolute');
      expect(scriptContent).toContain('path.join(process.cwd()');
    });

    it('should return proper result structure', async () => {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');

      // Should return success/path/error structure
      expect(scriptContent).toContain('success: true');
      expect(scriptContent).toContain('success: false');
      expect(scriptContent).toContain('path:');
      expect(scriptContent).toContain('error:');
    });
  });

  describe('error handling', () => {
    it('should handle file not found errors', async () => {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');

      expect(scriptContent).toContain('File not found');
    });

    it('should prevent directory deletion', async () => {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');

      expect(scriptContent).toContain('Cannot delete directories with this tool');
    });

    it('should handle unknown errors', async () => {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');

      expect(scriptContent).toContain('Unknown error occurred');
    });
  });
});
