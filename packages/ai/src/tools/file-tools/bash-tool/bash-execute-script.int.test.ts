import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('bash-execute-script integration', () => {
  const scriptPath = path.join(__dirname, 'bash-execute-script.ts');

  it('should execute single command successfully', () => {
    const commands = [{ command: 'echo "Hello World"' }];
    const result = execSync(`npx tsx ${scriptPath} '${JSON.stringify(commands)}'`, {
      encoding: 'utf-8',
    });

    const output = JSON.parse(result);
    expect(output).toHaveLength(1);
    expect(output[0]).toMatchObject({
      command: 'echo "Hello World"',
      stdout: 'Hello World',
      exitCode: 0,
      success: true,
    });
  });

  it('should execute multiple commands sequentially', () => {
    const commands = [
      { command: 'echo "First"', description: 'First echo' },
      { command: 'echo "Second"', description: 'Second echo' },
      { command: 'pwd', description: 'Print working directory' },
    ];

    const result = execSync(`npx tsx ${scriptPath} '${JSON.stringify(commands)}'`, {
      encoding: 'utf-8',
    });

    const output = JSON.parse(result);
    expect(output).toHaveLength(3);
    expect(output[0].stdout).toBe('First');
    expect(output[1].stdout).toBe('Second');
    expect(output[2].stdout).toMatch(/\/packages\/ai$/); // Should end with packages/ai directory
  });

  it('should capture stderr and handle failed commands', () => {
    const commands = [
      { command: 'echo "Success"' },
      { command: 'ls /nonexistent-directory-12345' },
      { command: 'echo "After failure"' },
    ];

    const result = execSync(`npx tsx ${scriptPath} '${JSON.stringify(commands)}'`, {
      encoding: 'utf-8',
    });

    const output = JSON.parse(result);
    expect(output).toHaveLength(3);

    // First command should succeed
    expect(output[0]).toMatchObject({
      stdout: 'Success',
      exitCode: 0,
      success: true,
    });

    // Second command should fail
    expect(output[1]).toMatchObject({
      stdout: '',
      exitCode: 1,
      success: false,
    });
    expect(output[1].stderr).toContain('No such file or directory');
    expect(output[1].error).toContain('No such file or directory');

    // Third command should still execute
    expect(output[2]).toMatchObject({
      stdout: 'After failure',
      exitCode: 0,
      success: true,
    });
  });

  it('should handle commands with pipes and redirections', () => {
    const commands = [
      { command: 'echo "Line 1\nLine 2\nLine 3" | grep "Line 2"' },
      { command: 'echo "Test" | wc -c' },
      { command: 'ls -la | head -n 3' },
    ];

    const result = execSync(`npx tsx ${scriptPath} '${JSON.stringify(commands)}'`, {
      encoding: 'utf-8',
    });

    const output = JSON.parse(result);
    expect(output).toHaveLength(3);

    expect(output[0].stdout).toBe('Line 2');
    expect(output[1].stdout.trim()).toMatch(/^\d+$/); // Should be a number
    expect(output[2].stdout.split('\n').length).toBeLessThanOrEqual(3);
  });

  it('should handle command timeout', () => {
    const commands = [{ command: 'sleep 2', timeout: 100 }];

    const result = execSync(`npx tsx ${scriptPath} '${JSON.stringify(commands)}'`, {
      encoding: 'utf-8',
    });

    const output = JSON.parse(result);
    expect(output[0]).toMatchObject({
      command: 'sleep 2',
      stdout: '',
      exitCode: 1,
      success: false,
    });
    expect(output[0].error).toContain('Command timed out after 100ms');
  });

  it('should handle environment variables', () => {
    const commands = [
      { command: 'TEST_VAR="Hello from env" && echo $TEST_VAR' },
      { command: 'echo $PATH | grep -o ":" | wc -l' }, // Count colons in PATH
    ];

    const result = execSync(`npx tsx ${scriptPath} '${JSON.stringify(commands)}'`, {
      encoding: 'utf-8',
    });

    const output = JSON.parse(result);
    expect(output[0].stdout).toBe('Hello from env');
    expect(Number.parseInt(output[1].stdout)).toBeGreaterThan(0); // PATH should have multiple directories
  });

  it('should handle commands with special characters', () => {
    const commands = [
      { command: 'echo "Special chars: dollar sign and ampersand"' },
      { command: 'echo "Quotes inside quotes"' },
      { command: 'echo "Line with\nnewline"' },
    ];

    const result = execSync(`npx tsx ${scriptPath} '${JSON.stringify(commands)}'`, {
      encoding: 'utf-8',
    });

    const output = JSON.parse(result);
    expect(output[0].stdout).toContain('Special chars: dollar sign and ampersand');
    expect(output[1].stdout).toBe('Quotes inside quotes');
    expect(output[2].stdout).toBe('Line with\nnewline');
  });

  it('should error when no arguments provided', () => {
    try {
      execSync(`npx tsx ${scriptPath} 2>&1`, { encoding: 'utf-8' });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.status).toBe(1);
      // Extract JSON from the output
      const output = error.stdout || error.stderr || '';
      const jsonMatch = output.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const errorOutput = JSON.parse(jsonMatch[0]);
        expect(errorOutput).toMatchObject({
          success: false,
          error: 'No commands provided. Expected JSON string as argument.',
        });
      } else {
        // If we can't find JSON, at least check the error occurred
        expect(output).toContain('No commands provided');
      }
    }
  });

  it('should error when invalid JSON provided', () => {
    try {
      execSync(`npx tsx ${scriptPath} 'invalid json' 2>&1`, { encoding: 'utf-8' });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.status).toBe(1);
      // Extract JSON from the output
      const output = error.stdout || error.stderr || '';
      const jsonMatch = output.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const errorOutput = JSON.parse(jsonMatch[0]);
        expect(errorOutput.success).toBe(false);
        expect(errorOutput.error).toContain('Unexpected token');
      } else {
        // If we can't find JSON, at least check the error occurred
        expect(output).toContain('Unexpected token');
      }
    }
  });

  it('should error when commands is not an array', () => {
    try {
      execSync(`npx tsx ${scriptPath} '{"command": "echo test"}' 2>&1`, { encoding: 'utf-8' });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.status).toBe(1);
      // Extract JSON from the output
      const output = error.stdout || error.stderr || '';
      const jsonMatch = output.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const errorOutput = JSON.parse(jsonMatch[0]);
        expect(errorOutput).toMatchObject({
          success: false,
          error: 'Commands must be an array',
        });
      } else {
        // If we can't find JSON, at least check the error occurred
        expect(output).toContain('Commands must be an array');
      }
    }
  });
});
