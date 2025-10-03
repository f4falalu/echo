import { materialize } from '@buster/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Helper to create mock process with readable streams
function createMockProcess(stdout: string, stderr: string, exitCode: number) {
  const stdoutBlob = new Blob([stdout]);
  const stderrBlob = new Blob([stderr]);

  return {
    stdout: stdoutBlob.stream(),
    stderr: stderrBlob.stream(),
    exited: Promise.resolve(exitCode),
    kill: vi.fn(),
  };
}

// Mock Bun global object
const mockSpawn = vi.fn();

globalThis.Bun = {
  spawn: mockSpawn,
} as any;

import { createBashTool } from './bash-tool';

describe('createBashTool', () => {
  const mockContext = {
    messageId: 'test-message-id',
    projectDirectory: '/tmp/test-project',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a bash tool with proper configuration', () => {
    const bashTool = createBashTool(mockContext);

    expect(bashTool).toBeDefined();
    expect(bashTool.description).toBeTruthy();
    expect(bashTool.inputSchema).toBeDefined();
    expect(bashTool.outputSchema).toBeDefined();
    expect(bashTool.execute).toBeDefined();
  });

  it('should handle successful command execution', async () => {
    mockSpawn.mockReturnValue(createMockProcess('Hello World', '', 0));

    const bashTool = createBashTool(mockContext);

    const rawResult = await bashTool.execute!(
      {
        command: 'echo "Hello World"',
        description: 'Test echo command',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result).toMatchObject({
      command: 'echo "Hello World"',
      stdout: 'Hello World',
      exitCode: 0,
      success: true,
    });
  });

  it('should handle command failures', async () => {
    mockSpawn.mockReturnValue(createMockProcess('', 'command not found', 127));

    const bashTool = createBashTool(mockContext);

    const rawResult = await bashTool.execute!(
      {
        command: 'nonexistentcommand',
        description: 'Test failing command',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result.exitCode).toBe(127);
    expect(result.success).toBe(false);
    expect(result.error).toContain('command not found');
  });

  it('should handle execution errors', async () => {
    mockSpawn.mockImplementation(() => {
      throw new Error('Execution failed');
    });

    const bashTool = createBashTool(mockContext);

    const rawResult = await bashTool.execute!(
      {
        command: 'echo "test"',
        description: 'Test command',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result).toMatchObject({
      command: 'echo "test"',
      success: false,
      error: 'Execution error: Execution failed',
    });
  });

  it('should truncate long output', async () => {
    const longOutput = 'a'.repeat(40000);
    mockSpawn.mockReturnValue(createMockProcess(longOutput, '', 0));

    const bashTool = createBashTool(mockContext);

    const rawResult = await bashTool.execute!(
      {
        command: 'echo "long output"',
        description: 'Test long output',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result.stdout.length).toBeLessThan(longOutput.length);
    expect(result.stdout).toContain('(Output was truncated due to length limit)');
  });

  it('should include timeout parameter', async () => {
    mockSpawn.mockReturnValue(createMockProcess('output', '', 0));

    const bashTool = createBashTool(mockContext);

    const rawResult = await bashTool.execute!(
      {
        command: 'ls',
        description: 'List files',
        timeout: 5000,
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result.success).toBe(true);
  });
});
