#!/usr/bin/env tsx
/**
 * Example runner to demonstrate how to use the docs agent test helpers
 * Run this file with: tsx packages/ai/src/workflows/docs-agent/test-helpers/run-example.ts
 */

import { currentSpan, initLogger, wrapTraced } from 'braintrust';
import docsAgentWorkflow from '../docs-agent-workflow';
import { TEST_MESSAGES, createTestContext, createTestWorkflowInput } from './context-helpers';
import {
  addFilesToSandbox,
  createFilesWithMissingDocs,
  createIntegrationTestSandbox,
} from './sandbox-helpers';

async function runExample() {
  console.info('🚀 Starting docs agent example...\n');

  // Initialize Braintrust logger if key is available
  let braintrustLogger = null;
  if (process.env.BRAINTRUST_KEY) {
    braintrustLogger = initLogger({
      apiKey: process.env.BRAINTRUST_KEY,
      projectName: 'DOCS-AGENT',
    });
    console.info('✅ Braintrust logging enabled\n');
  } else {
    console.warn('⚠️  No BRAINTRUST_KEY found, running without logging\n');
  }

  let testSandbox: Awaited<ReturnType<typeof createIntegrationTestSandbox>> | null = null;

  try {
    // Step 1: Create a test sandbox with mock dbt project
    console.info('📦 Creating test sandbox with mock dbt project...');
    testSandbox = await createIntegrationTestSandbox({
      projectOptions: {
        projectName: 'example_analytics',
        companyName: 'ExampleCo',
        includeDocumentation: false, // Start without docs
        includeTests: true,
        includeMacros: true,
      },
    });
    console.info(`✅ Sandbox created: ${testSandbox.sandboxId}\n`);

    // Step 2: Add some files that need documentation
    console.info('📄 Adding files with missing documentation...');
    await addFilesToSandbox(
      testSandbox.sandbox,
      createFilesWithMissingDocs(),
      testSandbox.projectPath
    );
    console.info('✅ Additional files added\n');

    // Step 3: Create context and input
    const context = createTestContext({
      sandbox: testSandbox.sandbox,
    });

    const input = createTestWorkflowInput({
      message: TEST_MESSAGES.documentAll,
      organizationId: 'example-org-123',
      context,
    });

    // Step 4: Run the workflow
    console.info('🤖 Running docs agent workflow...');
    console.info(`Message: "${input.message}"\n`);

    const startTime = Date.now();

    const result = braintrustLogger
      ? await wrapTraced(
          async () => {
            currentSpan().log({
              metadata: {
                exampleRun: true,
                sandboxId: testSandbox?.sandboxId,
                projectName: 'example_analytics',
              },
            });

            const run = docsAgentWorkflow.createRun();
            return await run.start({ inputData: input });
          },
          { name: 'Docs Agent Example Run' }
        )()
      : await docsAgentWorkflow.createRun().start({ inputData: input });

    const duration = Date.now() - startTime;

    // Step 5: Display results
    console.info('\n📊 Workflow Results:');
    console.info(`✅ Completed in ${duration}ms`);
    console.info('\nOutput:');
    console.info(JSON.stringify(result, null, 2));

    if (result.status === 'success' && result.result.documentationCreated) {
      console.info(
        `\n✅ Documentation created! ${result.result.metadata?.filesCreated || 0} files written`
      );
      if (result.result.metadata?.toolsUsed) {
        console.info(`Tools used: ${result.result.metadata.toolsUsed.join(', ')}`);
      }
    }

    if (result.status === 'success' && result.result.clarificationNeeded) {
      console.info('\n❓ Clarification needed:');
      console.info(`Issue: ${result.result.clarificationQuestion?.issue}`);
      console.info(`Question: ${result.result.clarificationQuestion?.clarificationQuestion}`);
    }

    if (result.status === 'success' && result.result.todos) {
      console.info(`\n📝 Generated ${result.result.todos.length} todos`);
    }
  } catch (error) {
    console.error('\n❌ Error running example:', error);
    throw error;
  } finally {
    // Cleanup
    if (testSandbox) {
      console.info('\n🧹 Cleaning up sandbox...');
      await testSandbox.cleanup();
      console.info('✅ Cleanup complete');
    }

    if (braintrustLogger) {
      await braintrustLogger.flush();
    }
  }
}

// Run the example
runExample()
  .then(() => {
    console.info('\n🎉 Example completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Example failed:', error);
    process.exit(1);
  });
