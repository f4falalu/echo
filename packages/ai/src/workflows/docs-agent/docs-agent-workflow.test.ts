import { describe, expect, it } from 'vitest';
import docsAgentWorkflow from './docs-agent-workflow';
import {
  TEST_MESSAGES,
  createTestContext,
  createTestWorkflowInput,
} from './test-helpers/context-helpers';
import { createMockSandbox } from './test-helpers/mock-sandbox';

describe('docs-agent-workflow with mock sandbox', () => {
  describe('workflow structure', () => {
    it('should have correct input and output schemas', () => {
      expect(docsAgentWorkflow.inputSchema).toBeDefined();
      expect(docsAgentWorkflow.outputSchema).toBeDefined();
    });

    it('should have all required steps', () => {
      const workflow = docsAgentWorkflow as any;
      // The workflow has a steps object with the step definitions
      const stepKeys = Object.keys(workflow.steps);
      expect(stepKeys).toHaveLength(3);
      expect(stepKeys).toContain('initialize-context');
      expect(stepKeys).toContain('create-docs-todos');
      expect(stepKeys).toContain('docs-agent');
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
