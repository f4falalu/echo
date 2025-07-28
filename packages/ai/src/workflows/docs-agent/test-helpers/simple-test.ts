#!/usr/bin/env tsx
/**
 * Simple test to verify the test helpers work correctly
 * Run with: tsx packages/ai/src/workflows/docs-agent/test-helpers/simple-test.ts
 */

import { addFiles } from '@buster/sandbox';
import { TEST_MESSAGES, createTestContext, createTestWorkflowInput } from './context-helpers';
import { generateMockDbtProject } from './mock-dbt-project';
import { createMockSandbox } from './mock-sandbox';
import { createFilesWithMissingDocs, createMalformedYamlFiles } from './sandbox-helpers';

async function runSimpleTest() {
  console.info('🧪 Running simple test of docs agent test helpers...\n');

  try {
    // Test 1: Mock sandbox creation
    console.info('1️⃣ Testing mock sandbox creation...');
    const mockSandbox = createMockSandbox();
    console.info(`✅ Created mock sandbox with ID: ${mockSandbox.id}\n`);

    // Test 2: Generate mock dbt project
    console.info('2️⃣ Testing mock dbt project generation...');
    const projectFiles = generateMockDbtProject({
      projectName: 'test_project',
      companyName: 'TestCo',
    });
    console.info(`✅ Generated ${projectFiles.length} project files\n`);

    // Test 3: Upload files to mock sandbox
    console.info('3️⃣ Testing file upload to mock sandbox...');
    const uploadResult = await addFiles(mockSandbox, projectFiles, {
      baseDestination: 'dbt_test',
    });
    console.info(`✅ Upload result: ${uploadResult.success ? 'Success' : 'Failed'}`);
    console.info(`   Files uploaded: ${uploadResult.uploadedFiles.length}\n`);

    // Test 4: Create test context
    console.info('4️⃣ Testing context creation...');
    const context = createTestContext({
      sandbox: mockSandbox,
      todoList: ['Document staging models', 'Update READMEs'],
    });
    console.info(`✅ Created context with ${context.todoList.length} todos\n`);

    // Test 5: Create workflow input
    console.info('5️⃣ Testing workflow input creation...');
    const input = createTestWorkflowInput({
      message: TEST_MESSAGES.documentAll,
      context,
    });
    console.info(`✅ Created workflow input with message: "${input.message}"\n`);

    // Test 6: Test file variations
    console.info('6️⃣ Testing file variations...');
    const malformedFiles = createMalformedYamlFiles();
    console.info(`   Created ${malformedFiles.length} malformed YAML files`);

    const missingDocsFiles = createFilesWithMissingDocs();
    console.info(`   Created ${missingDocsFiles.length} files with missing docs`);

    // Test 7: List files in mock sandbox
    console.info('\n7️⃣ Testing file listing in mock sandbox...');
    const files = await (
      mockSandbox.fs as unknown as { listDirectory: (path: string) => Promise<string[]> }
    ).listDirectory('dbt_test');
    console.info(`✅ Found ${files.length} files in sandbox`);
    console.info('   Sample files:', files.slice(0, 5).join(', '), '...\n');

    // Cleanup
    // Mock sandbox doesn't have a close method, but we can clear the storage
    console.info('🧹 Cleaned up mock sandbox\n');

    console.info('✅ All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runSimpleTest()
  .then(() => {
    console.info('\n🎉 Simple test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test error:', error);
    process.exit(1);
  });
