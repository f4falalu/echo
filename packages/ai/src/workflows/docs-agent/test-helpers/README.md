# Docs Agent Test Helpers

This directory contains test helpers for the docs agent workflow, including utilities for creating mock dbt projects, managing sandboxes, and running tests with Braintrust integration.

## Overview

The test helpers provide:

1. **Mock dbt Project Generator** - Creates realistic dbt projects for testing
2. **Sandbox Management** - Handles creation, file uploads, and cleanup of Daytona sandboxes
3. **Context Builders** - Creates valid `DocsAgentContext` objects for testing
4. **Braintrust Integration** - Wraps test execution with observability

## Usage

### Basic Test Setup

```typescript
import { createTestSandbox, createTestContext, createTestWorkflowInput } from './test-helpers';
import docsAgentWorkflow from './docs-agent-workflow';

// Create a test sandbox with mock dbt project
const testSandbox = await createTestSandbox({
  projectOptions: {
    projectName: 'analytics',
    companyName: 'TestCo',
    includeDocumentation: false,
  }
});

// Create context and input
const context = createTestContext({
  sandbox: testSandbox.sandbox,
});

const input = createTestWorkflowInput({
  message: 'Document all models in this dbt project',
  context,
});

// Run workflow
const result = await docsAgentWorkflow.createRun().start({ inputData: input });

// Cleanup
await testSandbox.cleanup();
```

### Mock dbt Project Options

The `generateMockDbtProject` function creates a complete dbt project with:

- **Staging models** - Stripe data transformations
- **Mart models** - Business metrics (MRR, revenue)
- **Schema documentation** - YAML files with descriptions
- **Tests** - Data quality checks
- **Macros** - Custom dbt macros
- **Configuration** - dbt_project.yml, packages.yml

### Test Scenarios

#### 1. Basic Documentation
```typescript
const testSandbox = await createTestSandbox({
  projectOptions: {
    includeDocumentation: false, // Start without docs
  }
});
```

#### 2. Missing Documentation
```typescript
await addFilesToSandbox(
  testSandbox.sandbox,
  createFilesWithMissingDocs(),
  testSandbox.projectPath
);
```

#### 3. Malformed YAML
```typescript
await addFilesToSandbox(
  testSandbox.sandbox,
  createMalformedYamlFiles(),
  testSandbox.projectPath
);
```

#### 4. Complex Project
```typescript
await addFilesToSandbox(
  testSandbox.sandbox,
  createComplexProjectStructure(),
  testSandbox.projectPath
);
```

### Context Variations

```typescript
// Context with pre-populated todos
const context = createContextWithTodos(sandbox);

// Context with clarification questions
const context = createContextWithClarifications(sandbox);

// Partially completed context
const context = createPartiallyCompletedContext(sandbox);
```

### Running Tests

```bash
# Run all workflow tests
bun test docs-agent-workflow.test.ts

# Run specific test
bun test docs-agent-workflow.test.ts -t "should successfully document"

# Run example
tsx packages/ai/src/workflows/docs-agent/test-helpers/run-example.ts
```

## File Structure

```
test-helpers/
├── mock-dbt-project.ts      # dbt project generator
├── sandbox-helpers.ts       # Sandbox management utilities
├── context-helpers.ts       # Context builders and validators
├── run-example.ts          # Example runner script
├── index.ts               # Exports
└── README.md             # This file
```

## Key Functions

### Mock Project Generation
- `generateMockDbtProject()` - Creates complete dbt project
- `generateProjectVariations()` - Returns different project configurations

### Sandbox Management
- `createTestSandbox()` - Creates sandbox with mock project
- `addFilesToSandbox()` - Adds additional files
- `createLocalTestProject()` - Creates local temp directory (for non-sandbox testing)

### Context Helpers
- `createTestContext()` - Creates basic context
- `createTestWorkflowInput()` - Creates workflow input
- `validateWorkflowOutput()` - Validates workflow results

### Test Data
- `createMalformedYamlFiles()` - Invalid YAML for error testing
- `createFilesWithMissingDocs()` - Models without documentation
- `createComplexProjectStructure()` - Multi-domain project

## Braintrust Integration

Tests automatically integrate with Braintrust when `BRAINTRUST_KEY` is set:

```typescript
const result = await runWorkflowWithTracing(input, {
  testType: 'basic-documentation',
  projectType: 'simple-dbt',
});
```

Traces appear in the `DOCS-AGENT` project in Braintrust.

## Best Practices

1. **Always cleanup sandboxes** - Use the cleanup function in afterEach hooks
2. **Use descriptive test metadata** - Pass meaningful metadata to Braintrust
3. **Test edge cases** - Include malformed files, missing docs, complex structures
4. **Validate outputs** - Use the validation helper to check workflow results
5. **Mock realistically** - The mock dbt project should resemble real projects