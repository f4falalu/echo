import { RuntimeContext } from '@mastra/core/runtime-context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';

const mockRunTypescript = vi.fn();
const mockReadFile = vi.fn();

vi.mock('@buster/sandbox', () => ({
  runTypescript: (...args: any[]) => mockRunTypescript(...args),
}));

vi.mock('node:fs/promises', () => ({
  readFile: (...args: any[]) => mockReadFile(...args),
}));

import { lsFiles } from './ls-files-tool';

describe('ls-files-tool', () => {
  let runtimeContext: RuntimeContext<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    runtimeContext = new RuntimeContext();
  });

  describe('lsFiles tool', () => {
    it('should have correct tool definition', () => {
      expect(lsFiles.id).toBe('ls-files');
      expect(lsFiles.description).toContain('Lists files and directories');
      expect(lsFiles.inputSchema).toBeDefined();
      expect(lsFiles.outputSchema).toBeDefined();
    });

    it('should validate input schema correctly', () => {
      const validInput = {
        paths: ['/test/path'],
        options: { detailed: true, all: false },
      };

      const result = lsFiles.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate output schema correctly', () => {
      const validOutput = {
        results: [
          {
            status: 'success' as const,
            path: '/test/path',
            entries: [
              {
                name: 'file.txt',
                type: 'file' as const,
                size: '1024',
                permissions: '-rw-r--r--',
                modified: 'Jan 15 10:30',
                owner: 'user',
                group: 'group',
              },
            ],
          },
        ],
      };

      const result = lsFiles.outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    it('should execute with sandbox when available', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);

      mockRunTypescript.mockResolvedValue({
        result: JSON.stringify([
          {
            success: true,
            path: '/test/path',
            entries: [{ name: 'file.txt', type: 'file' }],
          },
        ]),
        exitCode: 0,
      });

      const result = await lsFiles.execute({
        context: { paths: ['/test/path'] },
        runtimeContext,
      });

      expect(mockRunTypescript).toHaveBeenCalled();
      const call = mockRunTypescript.mock.calls[0];
      expect(call?.[0]).toBe(mockSandbox);
      expect(call?.[1]).toContain('const pathsJson =');
      expect(call?.[1]).toContain("const fs = require('fs')");
      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.status).toBe('success');
    });

    it('should return error when sandbox not available', async () => {
      // Don't set sandbox in runtime context
      const result = await lsFiles.execute({
        context: { paths: ['/test/path'] },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.status).toBe('error');
      if (result.results[0]?.status === 'error') {
        expect(result.results[0].error_message).toBe('ls command requires sandbox environment');
      }
    });

    it('should handle sandbox execution failure', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);

      mockRunTypescript.mockResolvedValue({
        result: '',
        exitCode: 1,
        stderr: 'Command failed',
      });

      const result = await lsFiles.execute({
        context: { paths: ['/test/path'] },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.status).toBe('error');
      if (result.results[0]?.status === 'error') {
        expect(result.results[0].error_message).toContain('Execution error');
      }
    });

    it('should handle empty paths array', async () => {
      const result = await lsFiles.execute({
        context: { paths: [] },
        runtimeContext,
      });

      expect(result.results).toHaveLength(0);
    });

    it('should handle mixed success and error results', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);

      mockRunTypescript.mockResolvedValue({
        result: JSON.stringify([
          {
            success: true,
            path: '/good/path',
            entries: [{ name: 'file.txt', type: 'file' }],
          },
          {
            success: false,
            path: '/bad/path',
            error: 'Path not found',
          },
        ]),
        exitCode: 0,
      });

      const result = await lsFiles.execute({
        context: { paths: ['/good/path', '/bad/path'] },
        runtimeContext,
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]?.status).toBe('success');
      expect(result.results[1]?.status).toBe('error');
      if (result.results[1]?.status === 'error') {
        expect(result.results[1].error_message).toBe('Path not found');
      }
    });
  });
});
