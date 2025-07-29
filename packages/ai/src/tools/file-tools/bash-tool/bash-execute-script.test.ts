import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const exec = promisify(child_process.exec);

describe('bash-execute-script', () => {
  const scriptPath = path.join(__dirname, 'bash-execute-script.ts');
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bash-execute-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  async function runScript(
    args: string[]
  ): Promise<{ stdout: string; stderr: string; error?: any }> {
    try {
      // Properly escape arguments for shell
      const escapedArgs = args.map((arg) => {
        // If it contains special characters, wrap in single quotes
        if (arg.includes(' ') || arg.includes('"') || arg.includes('[') || arg.includes(']')) {
          return `'${arg.replace(/'/g, "'\"'\"'")}'`;
        }
        return arg;
      });
      const { stdout, stderr } = await exec(`npx tsx ${scriptPath} ${escapedArgs.join(' ')}`, {
        env: { ...process.env, npm_config_loglevel: 'error' },
      });
      return { stdout, stderr };
    } catch (error: any) {
      // Return error info so tests can handle it
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        error,
      };
    }
  }

  describe('functional tests', () => {
    it('should execute a single command successfully', async () => {
      const commands = [
        {
          command: 'echo "Hello World"',
          description: 'Print hello world',
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        command: 'echo "Hello World"',
        stdout: 'Hello World',
        exitCode: 0,
        success: true,
      });
    });

    it('should handle command failure', async () => {
      const commands = [
        {
          command: 'exit 1',
          description: 'Exit with error code',
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        command: 'exit 1',
        stdout: '',
        exitCode: 1,
        success: false,
        error: 'Command failed',
      });
    });

    it('should execute multiple commands sequentially', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      const commands = [
        {
          command: `echo "First line" > ${testFile}`,
          description: 'Create file',
        },
        {
          command: `echo "Second line" >> ${testFile}`,
          description: 'Append to file',
        },
        {
          command: `cat ${testFile}`,
          description: 'Read file',
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2]).toMatchObject({
        success: true,
        stdout: 'First line\nSecond line',
      });
    });

    it('should handle base64 encoded input', async () => {
      const commands = [
        {
          command: 'pwd',
          description: 'Print working directory',
        },
      ];
      const base64Input = Buffer.from(JSON.stringify(commands)).toString('base64');

      const { stdout } = await runScript([base64Input]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].stdout).toBeTruthy();
    });

    it('should capture stderr output', async () => {
      const commands = [
        {
          command: 'ls /nonexistent-directory 2>&1',
          description: 'List nonexistent directory',
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].stdout).toContain('No such file or directory');
    });

    it('should handle timeout', async () => {
      const commands = [
        {
          command: 'sleep 5',
          description: 'Sleep for 5 seconds',
          timeout: 100, // 100ms timeout
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        success: false,
        error: 'Command timed out after 100ms',
      });
    });

    it('should handle piped commands', async () => {
      const commands = [
        {
          command: 'echo "line1\nline2\nline3" | grep line2',
          description: 'Pipe echo to grep',
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        success: true,
        stdout: 'line2',
      });
    });

    it('should handle environment variables', async () => {
      const commands = [
        {
          command: 'export TEST_VAR=hello && echo $TEST_VAR',
          description: 'Use environment variable',
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        success: true,
        stdout: 'hello',
      });
    });

    it('should handle working directory changes', async () => {
      const subDir = path.join(tempDir, 'subdir');
      await fs.mkdir(subDir);
      await fs.writeFile(path.join(subDir, 'test.txt'), 'test content');

      const commands = [
        {
          command: `cd ${subDir} && ls`,
          description: 'Change directory and list',
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        success: true,
        stdout: 'test.txt',
      });
    });

    it('should handle special characters in commands', async () => {
      const commands = [
        {
          command: 'echo "Hello $USER" && echo \'Single quotes\'',
          description: 'Special characters',
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].stdout).toContain('Single quotes');
    });

    it('should handle empty command array', async () => {
      const { stdout } = await runScript(['[]']);
      const results = JSON.parse(stdout);

      expect(results).toEqual([]);
    });

    it('should handle no arguments', async () => {
      const { stderr, error } = await runScript([]);
      expect(error).toBeDefined(); // Script exits with code 1

      // Extract JSON from stderr (might have npm warnings)
      const jsonMatch = stderr.match(/\{.*\}/s);
      expect(jsonMatch).toBeTruthy();
      const errorOutput = JSON.parse(jsonMatch![0]);
      expect(errorOutput).toMatchObject({
        success: false,
        error: 'No commands provided. Expected JSON string as argument.',
      });
    });

    it('should handle invalid JSON', async () => {
      const { stderr, error } = await runScript(['not valid json']);
      expect(error).toBeDefined(); // Script exits with code 1

      // Extract JSON from stderr (might have npm warnings)
      const jsonMatch = stderr.match(/\{.*\}/s);
      expect(jsonMatch).toBeTruthy();
      const errorOutput = JSON.parse(jsonMatch![0]);
      expect(errorOutput).toMatchObject({
        success: false,
        error: expect.stringContaining('Unexpected token'),
      });
    });

    it('should handle non-array input', async () => {
      const { stderr, error } = await runScript(['{"command": "echo test"}']);
      expect(error).toBeDefined(); // Script exits with code 1

      // Extract JSON from stderr (might have npm warnings)
      const jsonMatch = stderr.match(/\{.*\}/s);
      expect(jsonMatch).toBeTruthy();
      const errorOutput = JSON.parse(jsonMatch![0]);
      expect(errorOutput).toMatchObject({
        success: false,
        error: 'Commands must be an array',
      });
    });

    it('should execute commands with mixed success and failure', async () => {
      const commands = [
        { command: 'echo "Success"', description: 'Successful command' },
        { command: 'exit 42', description: 'Failed command' },
        { command: 'pwd', description: 'Another successful command' },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(3);
      expect(results[0]).toMatchObject({ success: true, stdout: 'Success' });
      expect(results[1]).toMatchObject({ success: false, exitCode: 42 });
      expect(results[2]).toMatchObject({ success: true });
    });

    it('should handle commands that produce large output', async () => {
      // Generate a large output
      const commands = [
        {
          command: 'for i in {1..100}; do echo "Line $i"; done',
          description: 'Generate 100 lines',
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      const lines = results[0].stdout.split('\n');
      expect(lines).toHaveLength(100);
      expect(lines[0]).toBe('Line 1');
      expect(lines[99]).toBe('Line 100');
    });
  });
});
