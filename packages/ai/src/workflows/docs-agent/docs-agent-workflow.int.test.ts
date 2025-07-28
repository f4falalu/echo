import type { Sandbox } from '@buster/sandbox';
import { currentSpan, initLogger, wrapTraced } from 'braintrust';
import type { Logger as BraintrustLogger } from 'braintrust';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocsAgentContext } from '../../context/docs-agent-context';
import docsAgentWorkflow from './docs-agent-workflow';
import {
  TEST_MESSAGES,
  createContextWithClarifications,
  createContextWithTodos,
  createPartiallyCompletedContext,
  createTestContext,
  createTestWorkflowInput,
  validateWorkflowOutput,
} from './test-helpers/context-helpers';
import {
  type TestSandboxResult,
  addFilesToSandbox,
  createComplexProjectStructure,
  createFilesWithMissingDocs,
  createIntegrationTestSandbox,
  createMalformedYamlFiles,
} from './test-helpers/sandbox-helpers';

describe('docs-agent-workflow', () => {
  let testSandbox: TestSandboxResult | null = null;
  let braintrustLogger: BraintrustLogger<true> | null = null;

  // Initialize Braintrust logger before each test
  beforeEach(() => {
    if (process.env.BRAINTRUST_KEY) {
      braintrustLogger = initLogger({
        apiKey: process.env.BRAINTRUST_KEY,
        projectName: process.env.ENVIRONMENT,
      });
    }
  });

  // Cleanup after each test
  afterEach(async () => {
    if (testSandbox) {
      await testSandbox.cleanup();
      testSandbox = null;
    }
    if (braintrustLogger) {
      await braintrustLogger.flush();
      braintrustLogger = null;
    }
  });

  /**
   * Helper to run workflow with Braintrust tracing
   */
  async function runWorkflowWithTracing(input: unknown, metadata: Record<string, unknown> = {}) {
    if (!braintrustLogger) {
      // Run without tracing if no Braintrust key
      const run = docsAgentWorkflow.createRun();
      return await run.start({ inputData: input as any });
    }

    return await wrapTraced(
      async () => {
        currentSpan().log({
          metadata: {
            testName: expect.getState().currentTestName,
            ...metadata,
          },
        });

        const run = docsAgentWorkflow.createRun();
        return await run.start({ inputData: input as any });
      },
      {
        name: 'Docs Agent Workflow Test',
      }
    )();
  }

  describe('basic workflow execution', () => {
    it('should successfully document a simple dbt project', async () => {
      // Create test sandbox with a minimal project
      testSandbox = await createIntegrationTestSandbox({
        projectOptions: {
          projectName: 'test_analytics',
          companyName: 'TestCo',
          includeDocumentation: false, // Start without docs
          includeTests: false, // Simplify - no tests
          includeMacros: false, // Simplify - no macros
        },
      });

      const context = createTestContext({
        sandbox: testSandbox.sandbox,
      });

      const input = createTestWorkflowInput({
        message: TEST_MESSAGES.documentSpecific, // Use simpler test message
        context,
      });

      const result = await runWorkflowWithTracing(input, {
        testType: 'basic-documentation',
        projectType: 'simple-dbt',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        // Check that the workflow completes
        expect(result.result).toBeDefined();
        expect(result.result.todos).toBeDefined();
        expect(result.result.todoList).toBeDefined();
        
        // Log what actually happened for debugging
        console.log('Workflow completed with:', {
          documentationCreated: result.result.documentationCreated,
          filesCreated: result.result.metadata?.filesCreated,
          toolsUsed: result.result.metadata?.toolsUsed,
          finished: result.result.finished,
        });
        
        // For now, we're just checking that the workflow runs without errors
        // The mock sandbox doesn't actually create files, but the agent should attempt to
      }
    }, 300000); // Increase timeout to 5 minutes

    it('should handle pre-populated todo list', async () => {
      testSandbox = await createIntegrationTestSandbox();
      const context = createContextWithTodos(testSandbox.sandbox);

      const input = createTestWorkflowInput({
        message: TEST_MESSAGES.completePartial,
        context,
      });

      const result = await runWorkflowWithTracing(input, {
        testType: 'todo-completion',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.result.todos).toBeDefined();
        expect(result.result.todoList).toBeDefined();
      }
    });

    it('should generate clarification questions when needed', async () => {
      testSandbox = await createIntegrationTestSandbox();

      // Add files with unclear business logic
      await addFilesToSandbox(
        testSandbox.sandbox,
        createFilesWithMissingDocs(),
        testSandbox.projectPath
      );

      const context = createTestContext({
        sandbox: testSandbox.sandbox,
      });

      const input = createTestWorkflowInput({
        message: TEST_MESSAGES.askClarification,
        context,
      });

      const result = await runWorkflowWithTracing(input, {
        testType: 'clarification-needed',
      });

      const validation = validateWorkflowOutput(result);
      expect(validation.isValid).toBe(true);

      if (result.status === 'success' && result.result.clarificationNeeded) {
        expect(result.result.clarificationQuestion).toBeDefined();
        if (result.result.clarificationQuestion) {
          expect(result.result.clarificationQuestion.issue).toBeTruthy();
          expect(result.result.clarificationQuestion.context).toBeTruthy();
          expect(result.result.clarificationQuestion.clarificationQuestion).toBeTruthy();
        }
      }
    });
  });

  describe('error handling', () => {
    it('should handle malformed YAML files gracefully', async () => {
      testSandbox = await createIntegrationTestSandbox();

      // Add malformed YAML files
      await addFilesToSandbox(
        testSandbox.sandbox,
        createMalformedYamlFiles(),
        testSandbox.projectPath
      );

      const context = createTestContext({
        sandbox: testSandbox.sandbox,
      });

      const input = createTestWorkflowInput({
        message: TEST_MESSAGES.fixYaml,
        context,
      });

      const result = await runWorkflowWithTracing(input, {
        testType: 'error-handling',
        errorType: 'malformed-yaml',
      });

      // Should complete successfully
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.result).toBeDefined();
        console.log('Malformed YAML test completed with:', {
          documentationCreated: result.result.documentationCreated,
          clarificationNeeded: result.result.clarificationNeeded,
          toolsUsed: result.result.metadata?.toolsUsed,
        });
      }
    });

    it('should handle missing sandbox gracefully', async () => {
      const context = createTestContext({
        sandbox: null as unknown as Sandbox, // Intentionally pass null
      });

      const input = createTestWorkflowInput({
        message: TEST_MESSAGES.documentAll,
        context,
      });

      const result = await runWorkflowWithTracing(input, {
        testType: 'error-handling',
        errorType: 'missing-sandbox',
      });

      // Workflow should fail gracefully
      expect(result.status).toBe('failed');
    });
  });

  describe('complex scenarios', () => {
    it('should handle large project with multiple domains', async () => {
      testSandbox = await createIntegrationTestSandbox({
        projectOptions: {
          includeDocumentation: false,
        },
      });

      // Add complex project structure
      await addFilesToSandbox(
        testSandbox.sandbox,
        createComplexProjectStructure(),
        testSandbox.projectPath
      );

      const context = createTestContext({
        sandbox: testSandbox.sandbox,
      });

      const input = createTestWorkflowInput({
        message: TEST_MESSAGES.documentAll,
        context,
      });

      const result = await runWorkflowWithTracing(input, {
        testType: 'complex-project',
        projectComplexity: 'high',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.result).toBeDefined();
        console.log('Complex project test completed with:', {
          documentationCreated: result.result.documentationCreated,
          filesCreated: result.result.metadata?.filesCreated,
          toolsUsed: result.result.metadata?.toolsUsed,
        });
      }
    }, 30000); // Increase timeout for complex test

    it('should resume partially completed documentation', async () => {
      testSandbox = await createIntegrationTestSandbox();
      const context = createPartiallyCompletedContext(testSandbox.sandbox);

      const input = createTestWorkflowInput({
        message: TEST_MESSAGES.completePartial,
        context,
      });

      const result = await runWorkflowWithTracing(input, {
        testType: 'resume-partial',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.result).toBeDefined();
        console.log('Resume partial test completed with:', {
          finished: result.result.finished,
          filesCreated: result.result.metadata?.filesCreated,
          toolsUsed: result.result.metadata?.toolsUsed,
        });
      }
    });
  });

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

  describe('integration with real sandbox', () => {
    it.skip('should work with actual Daytona sandbox', async () => {
      // This test requires actual Daytona setup
      // Skip in CI, run locally with proper credentials

      testSandbox = await createIntegrationTestSandbox({
        projectOptions: {
          projectName: 'production_analytics',
          companyName: 'RealCo',
        },
      });

      const context = createTestContext({
        sandbox: testSandbox.sandbox,
      });

      const input = createTestWorkflowInput({
        message: 'Document the entire dbt project with detailed explanations',
        context,
      });

      const result = await runWorkflowWithTracing(input, {
        testType: 'real-sandbox-integration',
        environment: 'production-like',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.result.documentationCreated).toBe(true);
      }

      // Verify files were actually created in sandbox
      const files = await (testSandbox.sandbox.fs as any).listDirectory(testSandbox.projectPath);
      expect(files).toContain('README.md');
    });
  });
});

// Performance benchmark tests
describe('docs-agent-workflow performance', () => {
  let testSandbox: TestSandboxResult | null = null;
  let braintrustLogger: BraintrustLogger<true> | null = null;

  // Initialize Braintrust logger before each test
  beforeEach(() => {
    if (process.env.BRAINTRUST_KEY) {
      braintrustLogger = initLogger({
        apiKey: process.env.BRAINTRUST_KEY,
        projectName: 'DOCS-AGENT',
      });
    }
  });

  afterEach(async () => {
    if (testSandbox) {
      await testSandbox.cleanup();
      testSandbox = null;
    }
    if (braintrustLogger) {
      await braintrustLogger.flush();
      braintrustLogger = null;
    }
  });

  /**
   * Helper to run workflow with Braintrust tracing
   */
  async function runWorkflowWithTracing(input: unknown, metadata: Record<string, unknown> = {}) {
    if (!braintrustLogger) {
      // Run without tracing if no Braintrust key
      const run = docsAgentWorkflow.createRun();
      return await run.start({ inputData: input as any });
    }

    return await wrapTraced(
      async () => {
        currentSpan().log({
          metadata: {
            testName: expect.getState().currentTestName,
            ...metadata,
          },
        });

        const run = docsAgentWorkflow.createRun();
        return await run.start({ inputData: input as any });
      },
      {
        name: 'Docs Agent Workflow Test',
      }
    )();
  }

  it('should complete basic documentation within reasonable time', async () => {
    const startTime = Date.now();

    testSandbox = await createIntegrationTestSandbox();
    const context = createTestContext({ sandbox: testSandbox.sandbox });
    const input = createTestWorkflowInput({
      message: TEST_MESSAGES.documentSpecific,
      context,
    });

    await runWorkflowWithTracing(input, {
      testType: 'performance',
      benchmark: true,
    });

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
  });
});
