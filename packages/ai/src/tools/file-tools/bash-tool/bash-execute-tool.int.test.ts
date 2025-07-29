import { createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { executeBash } from './bash-execute-tool';

describe('bash-execute-tool integration test', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;

  async function createTestSandbox() {
    return await createSandbox({
      language: 'typescript',
    });
  }

  it.concurrent.skipIf(!hasApiKey)('should execute bash commands in sandbox environment', async () => {
    const sandbox = await createTestSandbox();
    try {
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
    } finally {
      await sandbox.delete();
    }
  });

  it.concurrent.skipIf(!hasApiKey)('should handle command failures in sandbox', async () => {
    const sandbox = await createTestSandbox();
    try {
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
    } finally {
      await sandbox.delete();
    }
  });

  it.concurrent.skipIf(!hasApiKey)('should handle file operations via bash', async () => {
    const sandbox = await createTestSandbox();
    try {
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const testFile = `test-bash-${Date.now()}.txt`;
    const result = await executeBash.execute({
      context: {
        commands: [
          { command: `echo "test content" > ${testFile}`, description: 'Create file' },
          { command: `cat ${testFile}`, description: 'Read file' },
          { command: `rm ${testFile}`, description: 'Remove file' },
          { command: `cat ${testFile}`, description: 'Try to read removed file' },
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
    } finally {
      await sandbox.delete();
    }
  });

  it.concurrent.skipIf(!hasApiKey)('should respect command timeout', async () => {
    const sandbox = await createTestSandbox();
    try {
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
    } finally {
      await sandbox.delete();
    }
  }, 65000); // Increase timeout for this test since it creates a sandbox
});
