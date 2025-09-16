# Trigger Application

This app handles all background job processing using Trigger.dev v3. It assembles packages to run long-running and scheduled tasks.

## Core Responsibility

`@buster-app/trigger` is responsible for:
- Background job processing
- Scheduled/cron tasks
- Long-running AI agent workflows
- Async processing that shouldn't block the API
- Never interfaces directly with clients

## Architecture

```
Apps → @buster-app/trigger → Trigger.dev v3
              ↓
         Task Functions
              ↓
          Packages
    (Reuse all package logic)
```

## Task Organization

### Directory Structure

```
trigger/
├── src/
│   ├── tasks/
│   │   ├── ai/
│   │   │   ├── analyst-workflow.ts
│   │   │   ├── data-processing.ts
│   │   │   └── report-generation.ts
│   │   ├── data/
│   │   │   ├── sync-data-sources.ts
│   │   │   ├── refresh-materialized-views.ts
│   │   │   └── cleanup-old-data.ts
│   │   ├── notifications/
│   │   │   ├── send-email.ts
│   │   │   ├── send-slack.ts
│   │   │   └── webhook-delivery.ts
│   │   └── scheduled/
│   │       ├── daily-reports.ts
│   │       ├── usage-metrics.ts
│   │       └── health-checks.ts
│   ├── trigger.config.ts
│   └── index.ts
```

## Task Implementation

### Basic Task Pattern

Tasks are pure functions that use packages:

```typescript
import { task } from '@trigger.dev/sdk/v3';
import { z } from 'zod';
import { analystAgent } from '@buster/ai';
import { createChatMessage } from '@buster/database';

// Task input schema
const AnalystWorkflowParamsSchema = z.object({
  chatId: z.string().uuid().describe('Chat conversation ID'),
  query: z.string().describe('User query to analyze'),
  dataSourceId: z.string().uuid().describe('Data source to query'),
  userId: z.string().uuid().describe('User requesting analysis')
});

type AnalystWorkflowParams = z.infer<typeof AnalystWorkflowParamsSchema>;

// Task definition
export const analystWorkflow = task({
  id: 'analyst-workflow',
  retry: {
    maxAttempts: 3,
    minTimeout: '1s',
    maxTimeout: '10s'
  },
  run: async (params: AnalystWorkflowParams) => {
    const validated = AnalystWorkflowParamsSchema.parse(params);
    
    // Step 1: Run AI analysis
    const analysis = await analystAgent({
      query: validated.query,
      context: {
        dataSourceId: validated.dataSourceId,
        userId: validated.userId
      }
    });
    
    // Step 2: Save results to database
    await createChatMessage({
      chatId: validated.chatId,
      content: analysis.response,
      role: 'assistant',
      metadata: {
        toolCalls: analysis.toolCalls,
        usage: analysis.usage
      }
    });
    
    return {
      success: true,
      messageId: analysis.messageId
    };
  }
});
```

### Scheduled Task Pattern

```typescript
import { schedules } from '@trigger.dev/sdk/v3';
import { generateDailyReports } from '@buster/reporting';
import { getActiveOrganizations } from '@buster/database';

export const dailyReports = schedules.task({
  id: 'daily-reports',
  cron: '0 9 * * *', // 9 AM daily
  run: async () => {
    const organizations = await getActiveOrganizations();
    
    // Process each org in parallel
    const results = await Promise.all(
      organizations.map(org => 
        generateDailyReports({
          organizationId: org.id,
          date: new Date()
        })
      )
    );
    
    return {
      processed: results.length,
      successful: results.filter(r => r.success).length
    };
  }
});
```

## Long-Running Workflows

### Step-Based Workflows

```typescript
import { task, wait } from '@trigger.dev/sdk/v3';

export const dataImportWorkflow = task({
  id: 'data-import-workflow',
  run: async (params: ImportParams) => {
    // Step 1: Validate data source
    const validation = await task.run('validate-source', async () => {
      return validateDataSource(params.dataSourceId);
    });
    
    if (!validation.isValid) {
      throw new Error(`Invalid data source: ${validation.error}`);
    }
    
    // Step 2: Extract data
    const extraction = await task.run('extract-data', async () => {
      return extractData(params.dataSourceId);
    });
    
    // Step 3: Transform data
    const transformation = await task.run('transform-data', async () => {
      return transformData(extraction.data);
    });
    
    // Step 4: Wait for rate limit window
    await wait.for({ seconds: 5 });
    
    // Step 5: Load data
    const loading = await task.run('load-data', async () => {
      return loadData(transformation.data);
    });
    
    return {
      recordsProcessed: loading.count,
      duration: Date.now() - startTime
    };
  }
});
```

### Parallel Processing

```typescript
export const bulkAnalysis = task({
  id: 'bulk-analysis',
  run: async (params: BulkParams) => {
    const items = await getItemsToProcess(params.batchId);
    
    // Process in chunks to avoid overwhelming the system
    const chunks = chunkArray(items, 10);
    
    const results = [];
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(item => 
          task.run(`analyze-${item.id}`, () => 
            analyzeItem(item)
          )
        )
      );
      results.push(...chunkResults);
      
      // Rate limiting between chunks
      await wait.for({ seconds: 2 });
    }
    
    return {
      total: results.length,
      successful: results.filter(r => r.success).length
    };
  }
});
```

## Error Handling

### Retry Configuration

```typescript
export const resilientTask = task({
  id: 'resilient-task',
  retry: {
    maxAttempts: 5,
    minTimeout: '1s',
    maxTimeout: '30s',
    factor: 2, // Exponential backoff
    randomize: true
  },
  run: async (params) => {
    try {
      return await riskyOperation(params);
    } catch (error) {
      // Log error for monitoring
      console.error('Task failed:', error);
      
      // Determine if should retry
      if (error.code === 'RATE_LIMIT') {
        // Will be retried automatically
        throw error;
      }
      
      if (error.code === 'INVALID_INPUT') {
        // Don't retry for bad input
        return {
          success: false,
          error: 'Invalid input provided'
        };
      }
      
      // Unknown error, let it retry
      throw error;
    }
  }
});
```

### Dead Letter Queue

```typescript
export const criticalTask = task({
  id: 'critical-task',
  onFailure: async ({ error, params, attempts }) => {
    // Send to dead letter queue
    await saveFailedTask({
      taskId: 'critical-task',
      params,
      error: error.message,
      attempts,
      failedAt: new Date()
    });
    
    // Alert team
    await notifyOps({
      message: `Critical task failed after ${attempts} attempts`,
      error: error.message
    });
  },
  run: async (params) => {
    // Task implementation
  }
});
```

## Event-Driven Tasks

### Webhook Handler

```typescript
import { eventTrigger } from '@trigger.dev/sdk/v3';

export const handleWebhook = eventTrigger({
  id: 'handle-webhook',
  event: 'webhook.received',
  run: async (event) => {
    const { payload, headers } = event;
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      payload,
      headers['x-signature']
    );
    
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }
    
    // Process webhook
    await processWebhookPayload(payload);
    
    return { processed: true };
  }
});
```

## Package Integration

### Using Database Package

```typescript
import { 
  createJob,
  updateJobStatus,
  getJobById 
} from '@buster/database';

export const databaseTask = task({
  id: 'database-task',
  run: async (params) => {
    // Create job record
    const job = await createJob({
      type: 'data-processing',
      status: 'running',
      metadata: params
    });
    
    try {
      // Do work
      const result = await processData(params);
      
      // Update job status
      await updateJobStatus({
        jobId: job.id,
        status: 'completed',
        result
      });
      
      return result;
    } catch (error) {
      await updateJobStatus({
        jobId: job.id,
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }
});
```

### Using AI Package

```typescript
import { dataAnalysisWorkflow } from '@buster/ai';

export const aiAnalysisTask = task({
  id: 'ai-analysis',
  run: async (params) => {
    const result = await dataAnalysisWorkflow({
      userQuery: params.query,
      context: {
        dataSourceId: params.dataSourceId,
        userId: params.userId
      },
      schema: params.schema,
      examples: params.examples
    });
    
    return {
      understanding: result.understanding,
      sql: result.sql,
      analysis: result.analysis
    };
  }
});
```

## Testing Patterns

### Task Testing

```typescript
import { createTestTask } from '@trigger.dev/sdk/v3/testing';

describe('analystWorkflow', () => {
  it('should process analysis request', async () => {
    const testTask = createTestTask(analystWorkflow);
    
    const result = await testTask.run({
      chatId: 'test-chat',
      query: 'Show me sales data',
      dataSourceId: 'test-source',
      userId: 'test-user'
    });
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
  
  it('should retry on failure', async () => {
    const testTask = createTestTask(analystWorkflow);
    
    // Mock failure
    jest.spyOn(ai, 'analystAgent')
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce({ response: 'Success' });
    
    const result = await testTask.run({
      chatId: 'test-chat',
      query: 'Test query',
      dataSourceId: 'test-source',
      userId: 'test-user'
    });
    
    expect(result.success).toBe(true);
    expect(testTask.attempts).toBe(2);
  });
});
```

## Configuration

### Trigger Config

```typescript
// trigger.config.ts
import { defineConfig } from '@trigger.dev/sdk/v3';

export default defineConfig({
  project: 'buster-trigger',
  runtime: 'node',
  logLevel: 'info',
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeout: 1000,
      maxTimeout: 10000,
      factor: 2
    }
  },
  dirs: ['./src/tasks']
});
```

## Best Practices

### DO:
- Use packages for all business logic
- Validate inputs with Zod
- Implement proper error handling
- Use retries for transient failures
- Log important events
- Break large tasks into steps
- Use parallel processing when possible
- Clean up resources in finally blocks

### DON'T:
- Interface directly with clients
- Store state in task functions
- Use classes for task logic
- Skip input validation
- Ignore error handling
- Create infinite loops
- Make synchronous blocking calls
- Access external services without packages

## Monitoring

### Task Metrics

```typescript
export const monitoredTask = task({
  id: 'monitored-task',
  run: async (params) => {
    const startTime = Date.now();
    
    try {
      const result = await performWork(params);
      
      // Log success metric
      await logMetric({
        task: 'monitored-task',
        status: 'success',
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      // Log failure metric
      await logMetric({
        task: 'monitored-task',
        status: 'failure',
        duration: Date.now() - startTime,
        error: error.message
      });
      
      throw error;
    }
  }
});
```

This app should ONLY orchestrate background tasks using packages. All business logic belongs in packages.