import { type Sandbox, createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { executeBash } from './bash-execute-tool';

describe('bash-execute-tool integration test', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;
  let sandbox: Sandbox;

  beforeAll(async () => {
    if (!hasApiKey) return;

    // Create a sandbox for the tests
    sandbox = await createSandbox({
      language: 'typescript',
    });
  }, 60000); // 60 second timeout for sandbox creation

  afterAll(async () => {
    // Clean up the sandbox
    if (sandbox) {
      await sandbox.delete();
    }
  });

  it.skipIf(!hasApiKey)('should execute bash commands in sandbox environment', async () => {
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await executeBash.execute({
      context: {
        commands: [
          { command: 'pwd', description: 'Print working directory' },
          { command: 'echo "Hello from sandbox"', description: 'Echo test' },
          { command: 'ls -la', description: 'List files', timeout: 5000 },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(3);

    // Check pwd command
    expect(result.results[0]).toMatchObject({
      command: 'pwd',
      success: true,
      exitCode: 0,
    });
    expect(result.results[0]?.stdout).toBeTruthy();

    // Check echo command
    expect(result.results[1]).toMatchObject({
      command: 'echo "Hello from sandbox"',
      stdout: 'Hello from sandbox',
      success: true,
      exitCode: 0,
    });

    // Check ls command
    expect(result.results[2]).toMatchObject({
      command: 'ls -la',
      success: true,
      exitCode: 0,
    });
    expect(result.results[2]?.stdout).toBeTruthy();
  });

  it.skipIf(!hasApiKey)('should handle command failures in sandbox', async () => {
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await executeBash.execute({
      context: {
        commands: [
          { command: 'nonexistentcommand', description: 'Should fail' },
          { command: 'exit 1', description: 'Exit with error code' },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(2);

    // First command should fail
    expect(result.results[0]).toMatchObject({
      command: 'nonexistentcommand',
      success: false,
    });
    expect(result.results[0]?.error).toBeTruthy();

    // Second command should return exit code 1
    expect(result.results[1]).toMatchObject({
      command: 'exit 1',
      success: false,
      exitCode: 1,
    });
  });

  it.skipIf(!hasApiKey)('should handle file operations via bash', async () => {
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await executeBash.execute({
      context: {
        commands: [
          { command: 'echo "test content" > test.txt', description: 'Create file' },
          { command: 'cat test.txt', description: 'Read file' },
          { command: 'rm test.txt', description: 'Remove file' },
          { command: 'cat test.txt', description: 'Try to read removed file' },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(4);

    // Create file should succeed
    expect(result.results[0]?.success).toBe(true);

    // Read file should show content
    expect(result.results[1]).toMatchObject({
      success: true,
      stdout: 'test content',
    });

    // Remove file should succeed
    expect(result.results[2]?.success).toBe(true);

    // Try to read removed file should fail
    expect(result.results[3]?.success).toBe(false);
  });

  it.skipIf(!hasApiKey)('should respect command timeout', async () => {
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await executeBash.execute({
      context: {
        commands: [
          { command: 'sleep 2 && echo "completed"', description: 'Should timeout', timeout: 1000 },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.success).toBe(false);
    expect(result.results[0]?.error).toContain('timed out');
  });
});
