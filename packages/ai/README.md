# AI Package

AI agent logic, tool implementations, and integrations with AI providers using Vercel's AI SDK v5.

## Installation

```bash
pnpm add @buster/ai
```

## Overview

`@buster/ai` provides:
- AI agent implementations and workflows
- Tool definitions and execution
- Provider integrations (OpenAI, Anthropic, etc.)
- Prompt management and optimization
- Agent orchestration and chaining

## Technology Stack

- **AI SDK**: Vercel AI SDK v5 (latest)
- **Providers**: OpenAI, Anthropic, and more
- **Architecture**: Functional, composable agents
- **Testing**: Unit tests for logic, integration tests for providers

## Architecture

```
Apps ’ @buster/ai ’ AI Providers
           “
       Agents & Tools
    (Business Logic)
```

## Usage

### Basic Agent Example

Agents are pure functions that accept input and return output:

```typescript
import { analystAgent } from '@buster/ai';

const result = await analystAgent({
  query: 'Show me sales trends',
  context: {
    dataSourceId: 'source-123',
    userId: 'user-456',
    conversationId: 'conv-789'
  },
  options: {
    maxTokens: 1000,
    temperature: 0.7,
    model: 'gpt-4'
  }
});

console.info(result.response);
console.info(`Tokens used: ${result.usage.totalTokens}`);
```

### Creating Custom Agents

```typescript
import { z } from 'zod';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Define input schema
const MyAgentParamsSchema = z.object({
  query: z.string().describe('User query'),
  context: z.object({
    userId: z.string(),
    dataSourceId: z.string()
  })
});

type MyAgentParams = z.infer<typeof MyAgentParamsSchema>;

// Create agent function
export async function myAgent(params: MyAgentParams) {
  const validated = MyAgentParamsSchema.parse(params);
  
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: buildPrompt(validated),
    maxTokens: 1000
  });
  
  return {
    response: result.text,
    usage: result.usage
  };
}
```

### Tool Implementation

Tools are functions that can be called by agents:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const queryDatabaseTool = tool({
  description: 'Execute SQL query on the data source',
  parameters: z.object({
    query: z.string().describe('SQL query to execute'),
    limit: z.number().default(100).describe('Row limit')
  }),
  execute: async ({ query, limit }) => {
    const result = await executeQuery({
      query,
      maxRows: limit
    });
    
    return {
      rows: result.rows,
      rowCount: result.rows.length
    };
  }
});
```

## Agent Composition

### Chaining Agents

Compose complex workflows from simple agents:

```typescript
import { dataAnalysisWorkflow } from '@buster/ai';

const result = await dataAnalysisWorkflow({
  userQuery: 'Analyze customer churn',
  context: {
    dataSourceId: 'source-123',
    userId: 'user-456'
  },
  schema: databaseSchema,
  examples: previousQueries
});

// Result contains multiple steps
console.info(result.understanding);
console.info(result.sql);
console.info(result.analysis);
```

### Parallel Execution

```typescript
import { parallelAnalysis } from '@buster/ai';

const results = await parallelAnalysis({
  data: salesData,
  analyses: ['trends', 'anomalies', 'summary']
});

console.info(results.trends);
console.info(results.anomalies);
console.info(results.summary);
```

## Provider Management

### Multi-Provider Support

```typescript
import { selectModel } from '@buster/ai';

// Automatically select best model for task
const model = selectModel('smart'); // Uses GPT-4
const fastModel = selectModel('fast'); // Uses GPT-3.5
const creativeModel = selectModel('creative'); // Uses Claude
```

### Provider Fallback

```typescript
import { executeWithFallback } from '@buster/ai';

// Automatically falls back to other providers on failure
const result = await executeWithFallback({
  prompt: 'Analyze this data',
  providers: ['openai-gpt4', 'anthropic-claude', 'openai-gpt35']
});
```

## Streaming Responses

```typescript
import { streamingAgent } from '@buster/ai';

const stream = await streamingAgent({
  prompt: 'Generate a detailed report',
  onChunk: (chunk) => {
    // Handle each chunk as it arrives
    console.info(chunk);
  }
});

// Use in API response
return new Response(stream);
```

## Prompt Engineering

### Structured Prompts

```typescript
import { buildAnalystPrompt } from '@buster/ai';

const prompt = buildAnalystPrompt({
  query: 'Show revenue by region',
  context: {
    database: 'sales_db',
    schema: tableSchema
  },
  maxRows: 100
});
```

### Dynamic Templates

```typescript
import { PromptTemplates } from '@buster/ai';

const analysisPrompt = PromptTemplates.analysis({
  data: salesData,
  focusAreas: ['trends', 'anomalies']
});

const sqlPrompt = PromptTemplates.sqlGeneration({
  schema: databaseSchema,
  query: userQuestion
});
```

## Error Handling

### Graceful Degradation

```typescript
import { robustAgent } from '@buster/ai';

const result = await robustAgent({
  prompt: 'Complex analysis',
  fallbackStrategy: 'simplify' // or 'retry', 'alternative'
});
```

### Rate Limit Handling

```typescript
try {
  const result = await agent({ prompt });
} catch (error) {
  if (error.code === 'rate_limit') {
    // Automatically handled with exponential backoff
  }
}
```

## Testing

### Unit Tests

```typescript
describe('analystAgent', () => {
  it('should analyze data correctly', async () => {
    // Mock AI SDK
    jest.mock('ai', () => ({
      generateText: jest.fn().mockResolvedValue({
        text: 'Analysis result',
        usage: { promptTokens: 100, completionTokens: 50 }
      })
    }));
    
    const result = await analystAgent({
      query: 'Test query',
      context: { dataSourceId: 'test', userId: 'test' }
    });
    
    expect(result.response).toBe('Analysis result');
    expect(result.usage.totalTokens).toBe(150);
  });
});
```

### Integration Tests

```typescript
describe('ai-providers.int.test.ts', () => {
  it('should connect to OpenAI', async () => {
    const result = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: 'Say hello',
      maxTokens: 10
    });
    
    expect(result.text).toBeTruthy();
  });
});
```

## Performance Optimization

### Response Caching

```typescript
import { cachedAgent } from '@buster/ai';

// Responses are cached for 1 hour
const result = await cachedAgent({
  prompt: 'Frequently asked query',
  cacheKey: 'faq-123',
  ttl: 3600000
});
```

### Batch Processing

```typescript
import { batchAnalysis } from '@buster/ai';

// Process multiple items efficiently
const results = await batchAnalysis({
  items: largeDataset,
  batchSize: 10,
  parallel: true
});
```

## Best Practices

### DO:
- Write pure, functional agents
- Validate all inputs with Zod
- Handle provider failures gracefully
- Use appropriate models for tasks
- Test with mocked AI responses
- Implement proper error handling
- Use streaming for long responses
- Cache responses when appropriate

### DON'T:
- Hardcode API keys
- Expose raw AI errors to users
- Use classes for agent logic
- Forget rate limiting
- Skip input validation
- Ignore token limits
- Mix business logic with AI calls

## Configuration

Set up AI providers with environment variables:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Development

```bash
# Build
turbo build --filter=@buster/ai

# Test
turbo test:unit --filter=@buster/ai
turbo test:integration --filter=@buster/ai

# Lint
turbo lint --filter=@buster/ai
```

This package focuses on one integration test to verify AI provider connectivity, with all other logic testable via unit tests.