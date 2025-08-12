import { describe, expect, it, vi } from 'vitest';
import {
  docsAgentWorkflowInputSchema,
  docsAgentWorkflowOutputSchema,
  runDocsAgentWorkflow,
} from './docs-agent-workflow';
import {
  TEST_MESSAGES,
  createTestContext,
  createTestWorkflowInput,
} from './test-helpers/context-helpers';
import { createMockSandbox } from './test-helpers/mock-sandbox';

// Mock the step functions
vi.mock('../../steps', () => ({
  runInitializeContextStep: vi.fn(async (params) => ({
    message: params.message,
    organizationId: params.organizationId,
    contextInitialized: true,
    context: params.context,
  })),
  runGetRepositoryTreeStep: vi.fn(async (params) => ({
    ...params,
    repositoryTree: 'mock-tree-structure',
  })),
  runCreateDocsTodosStep: vi.fn(async () => ({
    todos: '# Documentation Todo\n- [ ] Task 1\n- [ ] Task 2',
    todosMessage: {
      role: 'assistant',
      content: '# Documentation Todo\n- [ ] Task 1\n- [ ] Task 2',
    },
  })),
  runDocsAgentStep: vi.fn(async () => ({
    todos: ['Task 1', 'Task 2'],
    todoList: '# Documentation Todo\n- [ ] Task 1\n- [ ] Task 2',
    documentationCreated: true,
    clarificationNeeded: false,
    finished: true,
    metadata: {
      filesCreated: 2,
      toolsUsed: ['createFiles', 'editFiles'],
    },
  })),
}));

describe('docs-agent-workflow', () => {
  describe('workflow schemas', () => {
    it('should have correct input schema', () => {
      expect(docsAgentWorkflowInputSchema).toBeDefined();
      const shape = docsAgentWorkflowInputSchema.shape;
      expect(shape.message).toBeDefined();
      expect(shape.organizationId).toBeDefined();
      expect(shape.context).toBeDefined();
    });

    it('should have correct output schema', () => {
      expect(docsAgentWorkflowOutputSchema).toBeDefined();
      const shape = docsAgentWorkflowOutputSchema.shape;
      expect(shape.todos).toBeDefined();
      expect(shape.todoList).toBeDefined();
      expect(shape.documentationCreated).toBeDefined();
      expect(shape.clarificationNeeded).toBeDefined();
      expect(shape.clarificationQuestion).toBeDefined();
      expect(shape.finished).toBeDefined();
      expect(shape.metadata).toBeDefined();
    });
  });

  describe('test helpers', () => {
    it('should create mock sandbox successfully', () => {
      const mockSandbox = createMockSandbox();
      expect(mockSandbox).toBeDefined();
      expect(mockSandbox.id).toContain('mock-sandbox-');
      expect(mockSandbox.fs).toBeDefined();
    });

    it('should create valid test context', () => {
      const mockSandbox = createMockSandbox();
      const context = createTestContext({ sandbox: mockSandbox });

      expect(context).toBeDefined();
      expect(context.sandbox).toBe(mockSandbox);
      expect(context.dataSourceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(context.todoList).toBe('');
      expect(context.clarificationQuestions).toEqual([]);
    });

    it('should create valid workflow input', () => {
      const mockSandbox = createMockSandbox();
      const context = createTestContext({ sandbox: mockSandbox });
      const input = createTestWorkflowInput({
        message: TEST_MESSAGES.documentAll,
        context,
      });

      expect(input).toBeDefined();
      expect(input.message).toBe(TEST_MESSAGES.documentAll);
      expect(input.organizationId).toBe('test-org-123');
      expect(input.context).toBe(context);
    });
  });

  describe('workflow execution', () => {
    it('should execute workflow successfully with mocked steps', async () => {
      const mockSandbox = createMockSandbox();
      const context = createTestContext({ sandbox: mockSandbox });
      const input = createTestWorkflowInput({
        message: TEST_MESSAGES.documentAll,
        context,
      });

      const result = await runDocsAgentWorkflow(input);

      expect(result).toBeDefined();
      expect(result.documentationCreated).toBe(true);
      expect(result.finished).toBe(true);
      expect(result.todos).toEqual(['Task 1', 'Task 2']);
      expect(result.metadata?.filesCreated).toBe(2);
      expect(result.metadata?.toolsUsed).toContain('createFiles');
    });

    it('should validate input schema', async () => {
      const invalidInput = {
        message: 123, // Should be string
        organizationId: 'test-org',
        context: {},
      };

      await expect(runDocsAgentWorkflow(invalidInput as any)).rejects.toThrow();
    });
  });

  describe('mock sandbox functionality', () => {
    it('should upload and read files', async () => {
      const mockSandbox = createMockSandbox();

      // Upload a file
      await mockSandbox.fs.uploadFile('Test content', 'test.txt');

      // Read the file
      const content = await (mockSandbox.fs as any).readFile('test.txt');
      expect(content).toBe('Test content');
    });

    it('should list directory contents', async () => {
      const mockSandbox = createMockSandbox();

      // Upload multiple files
      await mockSandbox.fs.uploadFile('Content 1', 'dir/file1.txt');
      await mockSandbox.fs.uploadFile('Content 2', 'dir/file2.txt');
      await mockSandbox.fs.uploadFile('Content 3', 'other/file3.txt');

      // List directory
      const files = await (mockSandbox.fs as any).listDirectory('dir');
      expect(files).toHaveLength(2);
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
    });
  });
});
