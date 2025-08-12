import type { Sandbox } from '@buster/sandbox';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runGetRepositoryTreeStep } from './get-repository-tree-step';

// Mock the tree helper
vi.mock('../../../workflows/docs-agent-workflow/helpers/tree-helper', () => ({
  getRepositoryTree: vi.fn(),
}));

describe('runGetRepositoryTreeStep', () => {
  let mockSandbox: Sandbox;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a mock sandbox
    mockSandbox = {
      id: 'mock-sandbox-123',
      url: 'https://sandbox.example.com',
      fs: {
        uploadFile: vi.fn(),
        readFile: vi.fn(),
      },
      process: {
        executeCommand: vi.fn(),
      },
    } as unknown as Sandbox;
  });

  it('should generate repository tree successfully', async () => {
    // Mock the pwd command
    vi.mocked(mockSandbox.process.executeCommand).mockResolvedValueOnce({
      result: '/home/workspace',
      exitCode: 0,
      stderr: '',
    });

    // Mock the tree helper to return a successful result
    const mockTreeOutput = `.
├── src/
│   └── index.ts
└── package.json`;

    const { getRepositoryTree } = await import(
      '../../../workflows/docs-agent-workflow/helpers/tree-helper'
    );
    vi.mocked(getRepositoryTree).mockResolvedValueOnce({
      success: true,
      output: mockTreeOutput,
      command: 'tree --gitignore "."',
    });

    const input = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        dataSourceId: 'data-source-123',
        todoList: '',
        clarificationQuestions: [],
      },
    };

    const result = await runGetRepositoryTreeStep(input);

    expect(result).toBeDefined();
    expect(result.repositoryTree).toContain('<YOU ARE HERE: /home/workspace>');
    expect(result.repositoryTree).toContain(mockTreeOutput);
    expect(result.message).toBe('Test message');
    expect(result.organizationId).toBe('org-123');
    expect(result.context).toEqual(input.context);
  });

  it('should handle missing sandbox gracefully', async () => {
    const input = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: null as any,
        dataSourceId: 'data-source-123',
        todoList: '',
        clarificationQuestions: [],
      },
    };

    const result = await runGetRepositoryTreeStep(input);

    expect(result).toBeDefined();
    expect(result.repositoryTree).toBe('');
    expect(result.message).toBe('Test message');
  });

  it('should handle tree generation failure gracefully', async () => {
    // Mock the pwd command
    vi.mocked(mockSandbox.process.executeCommand).mockResolvedValueOnce({
      result: '/home/workspace',
      exitCode: 0,
      stderr: '',
    });

    // Mock the tree helper to return a failure
    const { getRepositoryTree } = await import(
      '../../../workflows/docs-agent-workflow/helpers/tree-helper'
    );
    vi.mocked(getRepositoryTree).mockResolvedValueOnce({
      success: false,
      error: 'tree command not found',
    });

    const input = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        dataSourceId: 'data-source-123',
        todoList: '',
        clarificationQuestions: [],
      },
    };

    const result = await runGetRepositoryTreeStep(input);

    expect(result).toBeDefined();
    expect(result.repositoryTree).toBe('');
    expect(result.message).toBe('Test message');
  });

  it('should handle pwd command failure gracefully', async () => {
    // Mock the pwd command to fail
    vi.mocked(mockSandbox.process.executeCommand).mockRejectedValueOnce(
      new Error('Command failed')
    );

    // Mock the tree helper to return a successful result
    const mockTreeOutput = `.
├── src/
│   └── index.ts
└── package.json`;

    const { getRepositoryTree } = await import(
      '../../../workflows/docs-agent-workflow/helpers/tree-helper'
    );
    vi.mocked(getRepositoryTree).mockResolvedValueOnce({
      success: true,
      output: mockTreeOutput,
      command: 'tree --gitignore "."',
    });

    const input = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        dataSourceId: 'data-source-123',
        todoList: '',
        clarificationQuestions: [],
      },
    };

    const result = await runGetRepositoryTreeStep(input);

    expect(result).toBeDefined();
    expect(result.repositoryTree).toContain('<YOU ARE HERE: ');
    expect(result.repositoryTree).toContain(mockTreeOutput);
  });

  it('should handle complete tree generation error gracefully', async () => {
    // Mock the pwd command
    vi.mocked(mockSandbox.process.executeCommand).mockResolvedValueOnce({
      result: '/home/workspace',
      exitCode: 0,
      stderr: '',
    });

    // Mock the tree helper to throw an error
    const { getRepositoryTree } = await import(
      '../../../workflows/docs-agent-workflow/helpers/tree-helper'
    );
    vi.mocked(getRepositoryTree).mockRejectedValueOnce(new Error('Unexpected error'));

    const input = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        dataSourceId: 'data-source-123',
        todoList: '',
        clarificationQuestions: [],
      },
    };

    const result = await runGetRepositoryTreeStep(input);

    expect(result).toBeDefined();
    expect(result.repositoryTree).toBe('');
    expect(result.message).toBe('Test message');
  });
});
