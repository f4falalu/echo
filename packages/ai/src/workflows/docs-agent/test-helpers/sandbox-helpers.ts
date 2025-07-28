import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { type FileInput, type Sandbox, addFiles, createSandbox } from '@buster/sandbox';
import { type MockDbtProjectOptions, generateMockDbtProject } from './mock-dbt-project';
import { createMockSandbox } from './mock-sandbox';

export interface TestSandboxOptions {
  projectOptions?: MockDbtProjectOptions;
  additionalFiles?: FileInput[];
  baseDir?: string;
}

export interface TestSandboxResult {
  sandbox: Sandbox;
  sandboxId: string;
  projectPath: string;
  cleanup: () => Promise<void>;
}

/**
 * Creates a test sandbox with a mock dbt project (always uses in-memory mock sandbox)
 * Use this for unit tests that don't need real sandbox functionality
 */
export async function createTestSandbox(
  options: TestSandboxOptions = {}
): Promise<TestSandboxResult> {
  const { projectOptions = {}, additionalFiles = [], baseDir = 'dbt_project' } = options;

  // Always use mock sandbox for unit tests
  const sandbox = createMockSandbox();
  const sandboxId = sandbox.id;

  // Generate mock project files
  const projectFiles = generateMockDbtProject(projectOptions);
  const allFiles = [...projectFiles, ...additionalFiles];

  // Upload files to sandbox
  console.log(`[TestSandbox] Uploading ${allFiles.length} files to ${baseDir} directory`);
  console.log('[TestSandbox] Files being uploaded:', allFiles.map(f => f.path).slice(0, 10));
  
  const uploadResult = await addFiles(sandbox, allFiles, {
    baseDestination: baseDir,
    overwrite: true,
  });

  if (!uploadResult.success) {
    throw new Error(
      `Failed to upload files to sandbox: ${JSON.stringify(uploadResult.failedFiles)}`
    );
  }
  
  console.log(`[TestSandbox] Successfully uploaded files to ${baseDir}`);
  console.log('[TestSandbox] Uploaded files count:', uploadResult.uploadedFiles.length);

  // Return sandbox info with cleanup function
  return {
    sandbox,
    sandboxId,
    projectPath: baseDir,
    cleanup: async () => {
      // Mock sandbox cleanup - storage cleared in memory
      // No explicit close needed for mock sandbox
    },
  };
}

/**
 * Creates a real sandbox with a mock dbt project for integration testing
 * This will use actual Daytona sandbox when DAYTONA_API_KEY is available,
 * otherwise falls back to mock sandbox
 */
export async function createIntegrationTestSandbox(
  options: TestSandboxOptions = {}
): Promise<TestSandboxResult> {
  const { projectOptions = {}, additionalFiles = [], baseDir = 'dbt_project' } = options;

  let sandbox: Sandbox;
  try {
    // Try to create real sandbox if Daytona is available
    sandbox = await createSandbox({ language: 'typescript' });
    console.info('Using real Daytona sandbox for integration test');
  } catch (_error) {
    // Fall back to mock sandbox if Daytona is not available
    console.warn('Daytona not available, using mock sandbox for integration test');
    sandbox = createMockSandbox();
  }

  const sandboxId = sandbox.id;

  // Generate mock project files
  const projectFiles = generateMockDbtProject(projectOptions);
  const allFiles = [...projectFiles, ...additionalFiles];

  // Upload files to sandbox
  console.log(`[TestSandbox] Uploading ${allFiles.length} files to ${baseDir} directory`);
  console.log('[TestSandbox] Files being uploaded:', allFiles.map(f => f.path).slice(0, 10));
  
  const uploadResult = await addFiles(sandbox, allFiles, {
    baseDestination: baseDir,
    overwrite: true,
  });

  if (!uploadResult.success) {
    throw new Error(
      `Failed to upload files to sandbox: ${JSON.stringify(uploadResult.failedFiles)}`
    );
  }
  
  console.log(`[TestSandbox] Successfully uploaded files to ${baseDir}`);
  console.log('[TestSandbox] Uploaded files count:', uploadResult.uploadedFiles.length);

  // Return sandbox info with cleanup function
  return {
    sandbox,
    sandboxId,
    projectPath: baseDir,
    cleanup: async () => {
      // Try to close real sandbox if it has the method
      if ('close' in sandbox && typeof sandbox.close === 'function') {
        try {
          await sandbox.close();
        } catch (error) {
          console.error('Error closing sandbox:', error);
        }
      }
    },
  };
}

/**
 * Creates a local temporary directory with a mock dbt project for testing
 */
export async function createLocalTestProject(
  options: MockDbtProjectOptions = {}
): Promise<{ projectPath: string; cleanup: () => Promise<void> }> {
  const tempDir = path.join(tmpdir(), `dbt-test-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  const projectFiles = generateMockDbtProject(options);

  // Write all files to temp directory
  for (const file of projectFiles) {
    const filePath = path.join(tempDir, file.path);
    const fileDir = path.dirname(filePath);

    await fs.mkdir(fileDir, { recursive: true });

    const content =
      typeof file.content === 'string' ? file.content : file.content?.toString() || '';

    await fs.writeFile(filePath, content, 'utf-8');
  }

  return {
    projectPath: tempDir,
    cleanup: async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Failed to cleanup temp directory:', error);
      }
    },
  };
}

/**
 * Helper to add additional files to an existing sandbox
 */
export async function addFilesToSandbox(
  sandbox: Sandbox,
  files: FileInput[],
  baseDir = 'dbt_project'
): Promise<void> {
  const uploadResult = await addFiles(sandbox, files, {
    baseDestination: baseDir,
    overwrite: true,
  });

  if (!uploadResult.success) {
    throw new Error(`Failed to add files to sandbox: ${JSON.stringify(uploadResult.failedFiles)}`);
  }
}

/**
 * Helper to create malformed YAML files for error testing
 */
export function createMalformedYamlFiles(): FileInput[] {
  return [
    {
      path: 'models/staging/malformed_schema.yml',
      content: `version: 2

models:
  - name: test_model
    description: "Test model with malformed YAML"
    columns:
      - name: id
        description: "Missing closing quote
        tests:
          - unique
      - name: invalid
        tests: [not_null
`,
    },
    {
      path: 'dbt_project.yml',
      content: `name: 'broken_project
version: '1.0.0'
  invalid_indentation:
    - mixed tabs and spaces
	  - this will break
`,
    },
  ];
}

/**
 * Helper to create files with missing documentation
 */
export function createFilesWithMissingDocs(): FileInput[] {
  return [
    {
      path: 'models/staging/undocumented/users.sql',
      content: `select
    id,
    email,
    created_at,
    updated_at,
    is_active
from {{ source('app', 'users') }}
`,
    },
    {
      path: 'models/staging/undocumented/orders.sql',
      content: `select
    id,
    user_id,
    order_date,
    total_amount,
    status
from {{ source('app', 'orders') }}
`,
    },
    {
      path: 'models/staging/undocumented/schema.yml',
      content: `version: 2

models:
  - name: users
    # Missing description and column documentation
    columns:
      - name: id
        tests:
          - unique
          - not_null
      - name: email
      - name: created_at
      
  - name: orders
    # Missing all documentation
`,
    },
  ];
}

/**
 * Helper to create a complex project structure for testing
 */
export function createComplexProjectStructure(): FileInput[] {
  const files: FileInput[] = [];

  // Multiple data sources
  const dataSources = ['stripe', 'salesforce', 'postgres', 'snowplow'];

  for (const source of dataSources) {
    files.push({
      path: `models/staging/${source}/README.md`,
      content: `# ${source} Staging Models

This directory contains staging models for ${source} data.
`,
    });

    files.push({
      path: `models/staging/${source}/schema.yml`,
      content: `version: 2

sources:
  - name: ${source}
    database: raw
    schema: ${source}
    tables:
      - name: table1
      - name: table2
`,
    });
  }

  // Multiple business domains
  const domains = ['finance', 'marketing', 'operations', 'product'];

  for (const domain of domains) {
    files.push({
      path: `models/marts/${domain}/README.md`,
      content: `# ${domain} Data Mart

Business logic for ${domain} analytics.
`,
    });
  }

  // Analysis files
  files.push({
    path: 'analyses/customer_churn_analysis.sql',
    content: `-- Customer churn analysis
with churned_customers as (
    select * from {{ ref('dim_customers') }}
    where churned_at is not null
)
select * from churned_customers
`,
  });

  // Snapshots
  files.push({
    path: 'snapshots/customers_snapshot.sql',
    content: `{% snapshot customers_snapshot %}
    {{
        config(
          target_schema='snapshots',
          unique_key='id',
          strategy='timestamp',
          updated_at='updated_at',
        )
    }}
    select * from {{ source('app', 'customers') }}
{% endsnapshot %}
`,
  });

  return files;
}
