import { createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { executeBash } from './bash-execute-tool';

describe.sequential('bash-execute-tool integration test', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;
  let sharedSandbox: any;

  beforeAll(async () => {
    if (hasApiKey) {
      sharedSandbox = await createSandbox({
        language: 'typescript',
      });
    }
  }, 120000);

  afterAll(async () => {
    if (sharedSandbox) {
      await sharedSandbox.delete();
    }
  }, 65000);

  function getTestDir() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  (hasApiKey ? it : it.skip)('should execute bash commands in sandbox environment', async () => {
    const testDir = getTestDir();
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

    const result = await executeBash.execute({
      context: {
        commands: [
          {
            command: `mkdir -p /tmp/${testDir} && cd /tmp/${testDir} && pwd`,
            description: 'Create test dir and print working directory',
          },
          { command: `cd /tmp/${testDir} && echo "Hello from sandbox"`, description: 'Echo test' },
          { command: `cd /tmp/${testDir} && ls -la`, description: 'List files', timeout: 5000 },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(3);

    // Check pwd command
    expect(result.results[0]).toMatchObject({
      command: `mkdir -p /tmp/${testDir} && cd /tmp/${testDir} && pwd`,
      success: true,
      exitCode: 0,
    });
    expect(result.results[0]?.stdout).toContain(testDir);

    // Check echo command
    expect(result.results[1]).toMatchObject({
      command: `cd /tmp/${testDir} && echo "Hello from sandbox"`,
      stdout: 'Hello from sandbox',
      success: true,
      exitCode: 0,
    });

    // Check ls command
    expect(result.results[2]).toMatchObject({
      command: `cd /tmp/${testDir} && ls -la`,
      success: true,
      exitCode: 0,
    });
    expect(result.results[2]?.stdout).toBeTruthy();
  });

  (hasApiKey ? it : it.skip)('should handle command failures in sandbox', async () => {
    const testDir = getTestDir();
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

    const result = await executeBash.execute({
      context: {
        commands: [
          {
            command: `mkdir -p /tmp/${testDir} && cd /tmp/${testDir} && nonexistentcommand`,
            description: 'Should fail',
          },
          { command: `cd /tmp/${testDir} && exit 1`, description: 'Exit with error code' },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(2);

    // First command should fail
    expect(result.results[0]).toMatchObject({
      command: `mkdir -p /tmp/${testDir} && cd /tmp/${testDir} && nonexistentcommand`,
      success: false,
    });
    expect(result.results[0]?.error).toBeTruthy();

    // Second command should return non-zero exit code
    expect(result.results[1]).toMatchObject({
      command: `cd /tmp/${testDir} && exit 1`,
      success: false,
    });
    expect(result.results[1]?.exitCode).toBeGreaterThan(0);
  });

  (hasApiKey ? it : it.skip)('should handle file operations via bash', async () => {
    const testDir = getTestDir();
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

    const testFile = `test-bash-${Date.now()}.txt`;
    const result = await executeBash.execute({
      context: {
        commands: [
          {
            command: `echo "test content" > ${testFile}`,
            description: 'Create file',
          },
          { command: `cat ${testFile}`, description: 'Read file' },
          { command: `rm ${testFile}`, description: 'Remove file' },
          {
            command: `cat ${testFile}`,
            description: 'Try to read removed file',
          },
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

  // Skip timeout test as the sandbox doesn't support the timeout command
  // TODO: Implement timeout handling in a different way if needed
  it.skip('should respect command timeout', async () => {
    const testDir = getTestDir();
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

    const result = await executeBash.execute({
      context: {
        commands: [
          {
            command: `mkdir -p ${testDir} && cd ${testDir} && sleep 2 && echo "completed"`,
            description: 'Should timeout',
            timeout: 1000,
          },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.success).toBe(false);
    expect(result.results[0]?.error).toContain('timed out');
  }, 65000); // Increase timeout for this test since it creates a sandbox
});
