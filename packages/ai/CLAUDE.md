# AI Package

This package contains all AI agent logic, tool implementations, and integrations with AI providers using Vercel's AI SDK v5.

## Core Responsibility

`@buster/ai` is responsible for:
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

## Agent Patterns

### Functional Agent Structure

Agents are pure functions that accept input and return output:

```typescript
import { z } from 'zod';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Agent input schema
const AnalystAgentParamsSchema = z.object({
  query: z.string().describe('User query to analyze'),
  context: z.object({
    dataSourceId: z.string().describe('Data source to query'),
    userId: z.string().describe('User making the request'),
    conversationId: z.string().optional().describe('Conversation context')
  }).describe('Execution context'),
  options: z.object({
    maxTokens: z.number().default(1000),
    temperature: z.number().default(0.7),
    model: z.string().default('gpt-4')
  }).optional().describe('AI generation options')
});

type AnalystAgentParams = z.infer<typeof AnalystAgentParamsSchema>;

// Agent function - pure and testable
export async function analystAgent(params: AnalystAgentParams) {
  const validated = AnalystAgentParamsSchema.parse(params);
  
  // Build prompt
  const prompt = buildAnalystPrompt(validated);
  
  // Execute with AI SDK v5
  const result = await generateText({
    model: openai(validated.options?.model || 'gpt-4'),
    prompt,
    maxTokens: validated.options?.maxTokens,
    temperature: validated.options?.temperature,
    tools: {
      queryDatabase: createQueryTool(validated.context.dataSourceId),
      analyzeSchema: createSchemaTool(validated.context.dataSourceId)
    }
  });
  
  return {
    response: result.text,
    toolCalls: result.toolCalls,
    usage: result.usage
  };
}
```

### Tool Implementation Pattern

Tools are functions that can be called by agents:

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { executeQuery } from '@buster/data-source';

export function createQueryTool(dataSourceId: string) {
  return tool({
    description: 'Execute SQL query on the data source',
    parameters: z.object({
      query: z.string().describe('SQL query to execute'),
      limit: z.number().default(100).describe('Row limit')
    }),
    execute: async ({ query, limit }) => {
      // Validate and execute query
      const result = await executeQuery({
        dataSourceId,
        query,
        maxRows: limit
      });
      
      return {
        rows: result.rows,
        rowCount: result.rows.length
      };
    }
  });
}
```

## Agent Composition

### Chaining Agents

Compose complex workflows from simple agents:

```typescript
export async function dataAnalysisWorkflow(params: WorkflowParams) {
  // Step 1: Understand the query
  const understanding = await queryUnderstandingAgent({
    query: params.userQuery,
    context: params.context
  });
  
  // Step 2: Generate SQL
  const sqlGeneration = await sqlGenerationAgent({
    naturalLanguage: understanding.interpretation,
    schema: params.schema,
    examples: params.examples
  });
  
  // Step 3: Execute and analyze
  const analysis = await dataAnalysisAgent({
    query: sqlGeneration.sql,
    data: await executeQuery(sqlGeneration.sql),
    originalQuestion: params.userQuery
  });
  
  return {
    understanding,
    sql: sqlGeneration,
    analysis
  };
}
```

### Parallel Agent Execution

```typescript
export async function parallelAnalysis(params: ParallelParams) {
  const [trends, anomalies, summary] = await Promise.all([
    trendAnalysisAgent(params),
    anomalyDetectionAgent(params),
    dataSummaryAgent(params)
  ]);
  
  return {
    trends,
    anomalies,
    summary
  };
}
```

## Provider Management

### Multi-Provider Support

```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

const ModelConfig = {
  FAST: 'gpt-3.5-turbo',
  SMART: 'gpt-4',
  CREATIVE: 'claude-3-opus'
} as const;

export function selectModel(requirement: 'fast' | 'smart' | 'creative') {
  switch (requirement) {
    case 'fast':
      return openai(ModelConfig.FAST);
    case 'smart':
      return openai(ModelConfig.SMART);
    case 'creative':
      return anthropic(ModelConfig.CREATIVE);
  }
}
```

### Provider Fallback

```typescript
export async function executeWithFallback(params: AgentParams) {
  const providers = [
    { model: openai('gpt-4'), name: 'OpenAI GPT-4' },
    { model: anthropic('claude-3-opus'), name: 'Anthropic Claude' },
    { model: openai('gpt-3.5-turbo'), name: 'OpenAI GPT-3.5' }
  ];
  
  for (const provider of providers) {
    try {
      return await generateText({
        model: provider.model,
        prompt: params.prompt,
        maxRetries: 2
      });
    } catch (error) {
      console.error(`Provider ${provider.name} failed:`, error);
      continue;
    }
  }
  
  throw new Error('All AI providers failed');
}
```

## Prompt Engineering

### Structured Prompts

```typescript
export function buildAnalystPrompt(params: AnalystParams): string {
  return `
    You are a data analyst helping users understand their data.
    
    Context:
    - Database: ${params.context.database}
    - Schema: ${JSON.stringify(params.schema)}
    
    User Query: ${params.query}
    
    Instructions:
    1. Analyze the user's question
    2. Generate appropriate SQL query
    3. Execute and interpret results
    4. Provide clear, actionable insights
    
    Constraints:
    - Use only available tables and columns
    - Limit results to ${params.maxRows} rows
    - Explain findings in business terms
  `;
}
```

### Dynamic Prompt Templates

```typescript
const PromptTemplates = {
  analysis: (data: AnalysisData) => `
    Analyze this dataset:
    ${formatDataForPrompt(data)}
    
    Focus on:
    - Key trends
    - Anomalies
    - Actionable insights
  `,
  
  sqlGeneration: (schema: Schema, query: string) => `
    Schema: ${formatSchema(schema)}
    Question: ${query}
    
    Generate a SQL query that answers this question.
    Include comments explaining the logic.
  `
};
```

## Testing Patterns

### Unit Testing Agents

```typescript
describe('analystAgent', () => {
  it('should analyze data correctly', async () => {
    // Mock AI SDK
    jest.mock('ai', () => ({
      generateText: jest.fn().mockResolvedValue({
        text: 'Analysis result',
        toolCalls: [],
        usage: { promptTokens: 100, completionTokens: 50 }
      })
    }));
    
    const result = await analystAgent({
      query: 'Show me sales trends',
      context: {
        dataSourceId: 'test-ds',
        userId: 'test-user'
      }
    });
    
    expect(result.response).toBe('Analysis result');
    expect(result.usage.totalTokens).toBe(150);
  });
  
  it('should handle tool calls', async () => {
    const mockToolCall = {
      name: 'queryDatabase',
      arguments: { query: 'SELECT * FROM sales' }
    };
    
    // Test tool execution
    const tool = createQueryTool('test-ds');
    const result = await tool.execute(mockToolCall.arguments);
    
    expect(result).toHaveProperty('rows');
    expect(result).toHaveProperty('rowCount');
  });
});
```

### Integration Testing

```typescript
describe('ai-providers.int.test.ts', () => {
  it('should connect to OpenAI', async () => {
    const result = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: 'Say hello',
      maxTokens: 10
    });
    
    expect(result.text).toBeTruthy();
    expect(result.usage).toBeDefined();
  });
  
  it('should handle provider errors gracefully', async () => {
    const result = await executeWithFallback({
      prompt: 'Test prompt',
      // Invalid API key to test fallback
      apiKey: 'invalid-key'
    });
    
    expect(result).toBeDefined();
  });
});
```

## Streaming Responses

### Stream Implementation

```typescript
import { streamText } from 'ai';

export async function streamingAgent(params: StreamingParams) {
  const stream = await streamText({
    model: openai('gpt-4'),
    prompt: params.prompt,
    onChunk: ({ chunk }) => {
      // Handle each chunk
      params.onChunk?.(chunk);
    }
  });
  
  // Return stream for consumption
  return stream;
}

// Usage in app
export async function handleStreamingRequest(req: Request) {
  const stream = await streamingAgent({
    prompt: req.body.prompt,
    onChunk: (chunk) => {
      // Send to client via SSE or WebSocket
      sendToClient(chunk);
    }
  });
  
  return new Response(stream);
}
```

## Error Handling

### Graceful Degradation

```typescript
export async function robustAgent(params: AgentParams) {
  try {
    // Try with advanced model
    return await generateText({
      model: openai('gpt-4'),
      prompt: params.prompt
    });
  } catch (error) {
    if (error.code === 'rate_limit') {
      // Fallback to simpler model
      return await generateText({
        model: openai('gpt-3.5-turbo'),
        prompt: simplifyPrompt(params.prompt)
      });
    }
    
    if (error.code === 'context_length') {
      // Reduce context and retry
      return await generateText({
        model: openai('gpt-4'),
        prompt: truncatePrompt(params.prompt)
      });
    }
    
    throw error;
  }
}
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

## Performance Optimization

### Response Caching

```typescript
const responseCache = new Map<string, CachedResponse>();

export async function cachedAgent(params: AgentParams) {
  const cacheKey = hashParams(params);
  
  if (responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < 3600000) { // 1 hour
      return cached.response;
    }
  }
  
  const response = await generateText({
    model: openai('gpt-4'),
    prompt: params.prompt
  });
  
  responseCache.set(cacheKey, {
    response,
    timestamp: Date.now()
  });
  
  return response;
}
```

### Batch Processing

```typescript
export async function batchAnalysis(items: AnalysisItem[]) {
  // Group into optimal batch sizes
  const batches = chunk(items, 10);
  
  const results = await Promise.all(
    batches.map(batch => 
      generateText({
        model: openai('gpt-4'),
        prompt: createBatchPrompt(batch)
      })
    )
  );
  
  return results.flatMap(r => parseBatchResponse(r.text));
}
```

This package should focus on one integration test to verify AI provider connectivity, with all other logic testable via unit tests.