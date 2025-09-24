#!/usr/bin/env tsx

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// Database connection details
const DB_HOST = 'localhost';
const DB_PORT = '54322';
const DB_USER = 'postgres';

async function runCommand(command: string): Promise<string> {
  console.info(`🔄 Running: ${command}`);

  try {
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('Warning') && !stderr.includes('WARN')) {
      console.error('⚠️ Command stderr:', stderr);
    }

    console.info(`✅ Successfully completed: ${command}`);
    return stdout;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error);
    throw error;
  }
}

async function isDatabaseReady(): Promise<boolean> {
  try {
    // Use pg_isready to check if PostgreSQL is accepting connections
    await execAsync(`pg_isready -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER}`, {
      timeout: 5000,
    });
    return true;
  } catch {
    return false;
  }
}

async function waitForDatabase(timeoutSeconds = 120): Promise<void> {
  console.info('🗄️ Waiting for database to be ready...');

  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;

  while (Date.now() - startTime < timeoutMs) {
    if (await isDatabaseReady()) {
      console.info('✅ Database is now accessible!');
      return;
    }

    // Wait 2 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 2000));
    process.stdout.write('.');
  }

  throw new Error(`Database failed to become accessible within ${timeoutSeconds} seconds`);
}

async function startSupabaseAndWait(): Promise<void> {
  console.info('🚀 Starting Supabase...\n');

  try {
    // Check if Supabase is already running
    // Start Supabase
    await runCommand('supabase start');

    // Wait for database to be ready
    await waitForDatabase();

    console.info('🎉 Supabase is fully ready!');
  } catch (error) {
    console.error('💥 Failed to start Supabase:', error);
    process.exit(1);
  }
}

// Run the script
startSupabaseAndWait();
