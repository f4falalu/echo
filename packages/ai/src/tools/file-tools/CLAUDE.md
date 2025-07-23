# File Tools - CLAUDE.md

This file provides guidance for working with file tools in the AI package, particularly for sandbox-aware file operations.

## Important Context: Sandbox vs Local Execution

Our file tools (like `read-files-tool`) need to work in two different environments:

1. **Local execution** - When running directly on the host machine
2. **Sandbox execution** - When running inside a Daytona sandbox via `@buster/sandbox`

## Key Implementation Guidelines

### 1. Always Prefer Async Operations for Local Code

When writing file operation code that runs locally, **always use async operations**:

```typescript
// ✅ GOOD - For local execution
import * as fs from 'node:fs/promises';

async function readFile(path: string) {
  const content = await fs.readFile(path, 'utf-8');
  return content;
}
```

```typescript
// ❌ AVOID - Don't use sync operations in local code
import * as fs from 'node:fs';

function readFile(path: string) {
  const content = fs.readFileSync(path, 'utf-8');
  return content;
}
```

### 2. Sandbox Code Generation Requirements

When generating code to run in the Daytona sandbox, you MUST use a different approach:

#### Use CommonJS, Not ES Modules
```typescript
// ✅ GOOD - For sandbox execution
const fs = require('fs');
const path = require('path');

// ❌ BAD - Sandbox doesn't support ES modules
import * as fs from 'node:fs/promises';
```

#### Use Synchronous Operations
```typescript
// ✅ GOOD - For sandbox execution
const content = fs.readFileSync(filePath, 'utf-8');

// ❌ BAD - Sandbox doesn't handle async/await well
const content = await fs.readFile(filePath, 'utf-8');
```

#### Add Type Annotations
```typescript
// ✅ GOOD - Explicit types for sandbox TypeScript
function readFile(filePath: string) {
  // ...
}

// ❌ BAD - Implicit any will fail in sandbox
function readFile(filePath) {
  // ...
}
```

#### No Top-Level Await
```typescript
// ✅ GOOD - Direct execution
const results = readFiles(['file.txt']);
console.log(JSON.stringify(results));

// ❌ BAD - Top-level await not supported
const results = await readFiles(['file.txt']);
```

### 3. Tool Implementation Pattern

Tools should check for sandbox in runtime context and adapt accordingly:

```typescript
import { DocsAgentContextKey } from '@buster/ai/context/docs-agent-context';
import { runTypescript } from '@buster/sandbox';

// In your tool execution:
const sandbox = runtimeContext.get(DocsAgentContextKey.Sandbox);

if (sandbox) {
  // Generate CommonJS/sync code for sandbox
  const code = generateSandboxCompatibleCode(params);
  const result = await runTypescript(sandbox, code);
  // Parse result.result as JSON
} else {
  // Use async/promises for local execution
  const result = await localAsyncImplementation(params);
}
```

### 4. Testing Considerations

- **Unit tests**: Test with real file system operations using async/await
- **Integration tests**: When creating files in sandbox tests, use synchronous operations
- **Generated code tests**: Verify the generated code works with `tsx` locally

## Common Pitfalls to Avoid

1. **Don't assume sandbox supports modern JavaScript features** - It's more restrictive than local Node.js
2. **Don't mix async and sync patterns** - Use async for local, sync for sandbox
3. **Don't forget type annotations in generated code** - Sandbox runs with TypeScript strict mode
4. **Don't use top-level await in generated code** - Not supported in sandbox environment

## Example: File Reading Tool

See `read-files-tool` for a complete implementation that:
- Uses `fs/promises` for local async operations
- Generates CommonJS/sync code for sandbox execution
- Includes comprehensive tests for both environments
- Properly handles errors in both contexts