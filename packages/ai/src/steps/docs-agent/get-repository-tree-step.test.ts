import type { Sandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocsAgentContextKeys } from '../../context/docs-agent-context';
import { getRepositoryTreeStep } from './get-repository-tree-step';

// Mock the tree helper
vi.mock('../../workflows/docs-agent/helpers/tree-helper', () => ({
  getRepositoryTree: vi.fn(),
}));

import { getRepositoryTree } from '../../workflows/docs-agent/helpers/tree-helper';

// Mock execution context types
interface MockStepContext {
  inputData: unknown;
  getInitData: () => Promise<{ message: string }>;
  runtimeContext: RuntimeContext;
  runId: string;
  mastra: Record<string, unknown>;
  getStepResult: () => Promise<Record<string, unknown>>;
  suspend: () => Promise<void>;
  emitter?: Record<string, unknown>;
}

describe('getRepositoryTreeStep', () => {
  let mockRuntimeContext: RuntimeContext;
  let mockSandbox: Sandbox;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRuntimeContext = new RuntimeContext();
    mockSandbox = { id: 'test-sandbox' } as Sandbox;
  });

  it('should generate repository tree when sandbox is available', async () => {
    const mockTreeOutput = `.
├── src/
│   ├── index.ts
│   └── utils.ts
├── package.json
└── README.md

2 directories, 4 files`;

    mockRuntimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);
    vi.mocked(getRepositoryTree).mockResolvedValue({
      success: true,
      output: mockTreeOutput,
      command: 'tree --gitignore -L 5 "."',
    });

    const inputData = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        todoList: '',
        clarificationQuestions: [],
        dataSourceId: 'ds-123',
      },
    };

    const mockContext: MockStepContext = {
      inputData,
      getInitData: async () => ({ message: 'Test message' }),
      runtimeContext: mockRuntimeContext,
      runId: 'test-run',
      mastra: {},
      getStepResult: async () => ({}),
      suspend: async () => {},
      [Symbol.for('emitter')]: {},
    };

    const result = await getRepositoryTreeStep.execute(mockContext as any);

    expect(result).toEqual({
      ...inputData,
      repositoryTree: mockTreeOutput,
    });

    expect(getRepositoryTree).toHaveBeenCalledWith(mockSandbox, '.', {
      gitignore: true,
      maxDepth: 5,
    });

    expect(mockRuntimeContext.get('repositoryTree')).toBe(mockTreeOutput);
  });

  it('should return empty string when sandbox is not available', async () => {
    // Don't set sandbox in runtime context

    const inputData = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        todoList: '',
        clarificationQuestions: [],
        dataSourceId: 'ds-123',
      },
    };

    const mockContext: MockStepContext = {
      inputData,
      getInitData: async () => ({ message: 'Test message' }),
      runtimeContext: mockRuntimeContext,
      runId: 'test-run',
      mastra: {},
      getStepResult: async () => ({}),
      suspend: async () => {},
      [Symbol.for('emitter')]: {},
    };

    const result = await getRepositoryTreeStep.execute(mockContext as any);

    expect(result).toEqual({
      ...inputData,
      repositoryTree: '',
    });

    expect(getRepositoryTree).not.toHaveBeenCalled();
  });

  it('should return empty string when tree generation fails', async () => {
    mockRuntimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);
    vi.mocked(getRepositoryTree).mockResolvedValue({
      success: false,
      error: 'Tree command not installed',
    });

    const inputData = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        todoList: '',
        clarificationQuestions: [],
        dataSourceId: 'ds-123',
      },
    };

    const mockContext: MockStepContext = {
      inputData,
      getInitData: async () => ({ message: 'Test message' }),
      runtimeContext: mockRuntimeContext,
      runId: 'test-run',
      mastra: {},
      getStepResult: async () => ({}),
      suspend: async () => {},
      [Symbol.for('emitter')]: {},
    };

    const result = await getRepositoryTreeStep.execute(mockContext as any);

    expect(result).toEqual({
      ...inputData,
      repositoryTree: '',
    });
  });

  it('should handle exceptions gracefully', async () => {
    mockRuntimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);
    vi.mocked(getRepositoryTree).mockRejectedValue(new Error('Unexpected error'));

    const inputData = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        todoList: '',
        clarificationQuestions: [],
        dataSourceId: 'ds-123',
      },
    };

    const mockContext: MockStepContext = {
      inputData,
      getInitData: async () => ({ message: 'Test message' }),
      runtimeContext: mockRuntimeContext,
      runId: 'test-run',
      mastra: {},
      getStepResult: async () => ({}),
      suspend: async () => {},
      [Symbol.for('emitter')]: {},
    };

    const result = await getRepositoryTreeStep.execute(mockContext as any);

    expect(result).toEqual({
      ...inputData,
      repositoryTree: '',
    });
  });

  it('should pass through all input data correctly', async () => {
    mockRuntimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);
    vi.mocked(getRepositoryTree).mockResolvedValue({
      success: true,
      output: 'tree output',
      command: 'tree',
    });

    const inputData = {
      message: 'Complex message with todos',
      organizationId: 'org-456',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        todoList: '- [ ] Task 1\n- [ ] Task 2',
        clarificationQuestions: [{ question: 'test' }],
        dataSourceId: 'ds-456',
      },
    };

    const mockContext: MockStepContext = {
      inputData,
      getInitData: async () => ({ message: 'Test message' }),
      runtimeContext: mockRuntimeContext,
      runId: 'test-run',
      mastra: {},
      getStepResult: async () => ({}),
      suspend: async () => {},
      [Symbol.for('emitter')]: {},
    };

    const result = await getRepositoryTreeStep.execute(mockContext as any);

    expect(result).toEqual({
      ...inputData,
      repositoryTree: 'tree output',
    });

    // Ensure all input data is preserved
    expect(result.message).toBe(inputData.message);
    expect(result.organizationId).toBe(inputData.organizationId);
    expect(result.contextInitialized).toBe(inputData.contextInitialized);
    expect(result.context).toEqual(inputData.context);
  });
});
