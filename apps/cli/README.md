# CLI Application

This is the command-line interface application built with TypeScript and Bun. It provides terminal-based access to Buster functionality.

## Installation

```bash
pnpm add @buster-app/cli
```

## Overview

`@buster-app/cli` is responsible for:
- Command-line interface for Buster operations
- Developer tools and utilities
- Administrative tasks
- Data import/export operations
- Communication with server via server-shared types

## Technology Stack

- **Runtime**: Bun (fast JavaScript runtime)
- **Framework**: Commander.js (CLI framework)
- **UI**: React Ink (interactive terminal UIs)
- **Validation**: Zod for input validation
- **Architecture**: Functional, command-based

## Architecture

```
CLI Commands → @buster-app/cli → @buster/server-shared → API Server
                    ↓
                Packages
           (Direct package usage)
```

## Command Structure

### Directory Organization

```
cli/
├── src/
│   ├── commands/
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   ├── logout.ts
│   │   │   └── status.ts
│   │   ├── data/
│   │   │   ├── import.ts
│   │   │   ├── export.ts
│   │   │   └── sync.ts
│   │   ├── dashboard/
│   │   │   ├── create.ts
│   │   │   ├── list.ts
│   │   │   └── delete.ts
│   │   └── admin/
│   │       ├── users.ts
│   │       ├── organizations.ts
│   │       └── system.ts
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── config.ts
│   │   └── utils.ts
│   └── index.tsx
```

## Command Implementation

### Basic Command Pattern

Commands are pure functions using Commander.js:

```typescript
import { Command } from 'commander';
import { z } from 'zod';
import type { CreateDashboardRequest } from '@buster/server-shared';
import { apiClient } from '../lib/api-client';

// Command options schema
const CreateDashboardOptionsSchema = z.object({
  name: z.string().describe('Dashboard name'),
  description: z.string().optional().describe('Dashboard description'),
  datasource: z.string().uuid().describe('Data source ID'),
  public: z.boolean().default(false).describe('Make dashboard public')
});

type CreateDashboardOptions = z.infer<typeof CreateDashboardOptionsSchema>;

export const createDashboardCommand = new Command('create')
  .description('Create a new dashboard')
  .requiredOption('-n, --name <name>', 'Dashboard name')
  .option('-d, --description <desc>', 'Dashboard description')
  .requiredOption('-s, --datasource <id>', 'Data source ID')
  .option('-p, --public', 'Make dashboard public', false)
  .action(async (options: unknown) => {
    try {
      const validated = CreateDashboardOptionsSchema.parse(options);
      
      // Create request
      const request: CreateDashboardRequest = {
        name: validated.name,
        description: validated.description,
        dataSourceId: validated.datasource,
        isPublic: validated.public
      };
      
      // Call API
      const response = await apiClient.createDashboard(request);
      
      // Display result
      console.info(`✅ Dashboard created: ${response.dashboard.id}`);
      console.info(`   Name: ${response.dashboard.name}`);
      console.info(`   URL: ${response.dashboard.url}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Invalid options:', error.errors);
      } else {
        console.error('❌ Failed to create dashboard:', error.message);
      }
      process.exit(1);
    }
  });
```

### Interactive Command Pattern

```typescript
import { prompt } from 'enquirer';

export const loginCommand = new Command('login')
  .description('Login to Buster')
  .option('-e, --email <email>', 'Email address')
  .option('-p, --password <password>', 'Password')
  .action(async (options) => {
    // Get credentials interactively if not provided
    const credentials = await getCredentials(options);
    
    try {
      const response = await apiClient.login(credentials);
      
      // Save token
      await saveAuthToken(response.token);
      
      console.info('✅ Successfully logged in');
      console.info(`   User: ${response.user.email}`);
      console.info(`   Organization: ${response.organization.name}`);
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      process.exit(1);
    }
  });

async function getCredentials(options: any) {
  const email = options.email || await prompt({
    type: 'input',
    name: 'email',
    message: 'Email:',
    validate: (value) => z.string().email().safeParse(value).success
  });
  
  const password = options.password || await prompt({
    type: 'password',
    name: 'password',
    message: 'Password:'
  });
  
  return { email, password };
}
```

## API Client

### Type-Safe API Client

```typescript
// lib/api-client.ts
import type { 
  CreateDashboardRequest,
  CreateDashboardResponse,
  GetDashboardsResponse 
} from '@buster/server-shared';

class ApiClient {
  private baseUrl: string;
  private token?: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = getStoredToken();
  }
  
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message, response.status);
    }
    
    return response.json();
  }
  
  async createDashboard(
    data: CreateDashboardRequest
  ): Promise<CreateDashboardResponse> {
    return this.request('/api/v2/dashboards', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async getDashboards(): Promise<GetDashboardsResponse> {
    return this.request('/api/v2/dashboards');
  }
}

export const apiClient = new ApiClient(
  process.env.BUSTER_API_URL || 'http://localhost:8080'
);
```

## Configuration Management

### Config File Pattern

```typescript
// lib/config.ts
import { z } from 'zod';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ConfigSchema = z.object({
  apiUrl: z.string().url().default('http://localhost:8080'),
  token: z.string().optional(),
  organization: z.string().uuid().optional(),
  outputFormat: z.enum(['json', 'table', 'csv']).default('table')
});

type Config = z.infer<typeof ConfigSchema>;

const CONFIG_PATH = join(homedir(), '.buster', 'config.json');

export function loadConfig(): Config {
  try {
    const data = readFileSync(CONFIG_PATH, 'utf-8');
    return ConfigSchema.parse(JSON.parse(data));
  } catch {
    return ConfigSchema.parse({});
  }
}

export function saveConfig(config: Partial<Config>): void {
  const current = loadConfig();
  const updated = { ...current, ...config };
  const validated = ConfigSchema.parse(updated);
  
  writeFileSync(
    CONFIG_PATH,
    JSON.stringify(validated, null, 2)
  );
}
```

## Output Formatting

### Table Output

```typescript
import { table } from 'table';

export function formatAsTable(data: any[]): string {
  if (data.length === 0) {
    return 'No data';
  }
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(h => String(item[h] ?? ''))
  );
  
  return table([headers, ...rows]);
}
```

### JSON Output

```typescript
export function formatAsJson(data: any): string {
  return JSON.stringify(data, null, 2);
}
```

### CSV Output

```typescript
export function formatAsCsv(data: any[]): string {
  if (data.length === 0) {
    return '';
  }
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(h => escapeCSV(String(item[h] ?? '')))
  );
  
  return [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
```

## Progress Indicators

### Spinner Pattern

```typescript
import ora from 'ora';

export async function withSpinner<T>(
  message: string,
  task: () => Promise<T>
): Promise<T> {
  const spinner = ora(message).start();
  
  try {
    const result = await task();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

// Usage
const dashboards = await withSpinner(
  'Fetching dashboards...',
  () => apiClient.getDashboards()
);
```

## Interactive UI with React Ink

### Menu Component

```typescript
import React from 'react';
import { Box, Text, useInput, useApp } from 'ink';

export function InteractiveMenu() {
  const [selected, setSelected] = React.useState(0);
  const { exit } = useApp();
  
  const options = ['Option 1', 'Option 2', 'Option 3'];
  
  useInput((input, key) => {
    if (key.upArrow) {
      setSelected(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setSelected(prev => Math.min(options.length - 1, prev + 1));
    }
    if (key.return) {
      console.info(`Selected: ${options[selected]}`);
      exit();
    }
    if (input === 'q' || key.escape) {
      exit();
    }
  });
  
  return (
    <Box flexDirection="column">
      <Text bold>Select an option:</Text>
      {options.map((option, i) => (
        <Text key={i} color={i === selected ? 'green' : 'white'}>
          {i === selected ? '▶' : ' '} {option}
        </Text>
      ))}
      <Text dimColor>Use arrow keys, Enter to select, Q to quit</Text>
    </Box>
  );
}
```

## Error Handling

### User-Friendly Errors

```typescript
export class CliError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'CliError';
  }
}

export function handleError(error: unknown): void {
  if (error instanceof CliError) {
    console.error(`❌ ${error.message}`);
    if (error.details && process.env.DEBUG) {
      console.error('Details:', error.details);
    }
  } else if (error instanceof z.ZodError) {
    console.error('❌ Validation error:');
    error.errors.forEach(e => {
      console.error(`   - ${e.path.join('.')}: ${e.message}`);
    });
  } else {
    console.error('❌ Unexpected error:', error);
  }
  
  process.exit(1);
}
```

## Testing Patterns

### Command Testing

```typescript
describe('create dashboard command', () => {
  it('should create dashboard with valid options', async () => {
    const mockApi = jest.spyOn(apiClient, 'createDashboard')
      .mockResolvedValue({
        dashboard: {
          id: '123',
          name: 'Test Dashboard',
          url: 'http://example.com/dashboard/123'
        }
      });
    
    await createDashboardCommand.parseAsync([
      'node',
      'cli',
      '--name',
      'Test Dashboard',
      '--datasource',
      'abc-123'
    ]);
    
    expect(mockApi).toHaveBeenCalledWith({
      name: 'Test Dashboard',
      dataSourceId: 'abc-123',
      isPublic: false
    });
  });
});
```

## Best Practices

### DO:
- Use Commander.js for command parsing
- Validate all inputs with Zod
- Import types from server-shared
- Provide interactive prompts for missing options
- Use spinners for long operations
- Format output based on user preference
- Handle errors gracefully
- Store configuration securely

### DON'T:
- Define API types locally
- Use classes for command logic
- Skip input validation
- Expose sensitive information
- Block on long operations without feedback
- Hardcode API endpoints
- Store passwords in plain text

## Quick Start

### Development

```bash
# Install dependencies
bun install

# Run in development mode with hot reload
bun run dev hello Claude --uppercase
bun run dev interactive

# Direct execution (fastest for development)
bun src/index.tsx hello
```

### Building

```bash
# Build TypeScript
bun run build

# Build standalone executable
bun run build:standalone

# Test standalone
./dist/buster hello
```

### Testing

```bash
# Run tests
turbo test:unit --filter=@buster-app/cli

# Run with coverage
turbo test:unit --filter=@buster-app/cli -- --coverage
```

## Deployment

```bash
# Build for distribution
bun run build:standalone

# The executable can be distributed without Bun installed
cp dist/buster /usr/local/bin/buster
```

This app should assemble packages for CLI operations and communicate with the server using server-shared types.