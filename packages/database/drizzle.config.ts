import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load specific .env file
config({ path: '../../.env' }); // or '.env.development', '.env.production', etc.

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString || '',
    ssl: 'require', // Add SSL configuration for pg driver
  },
  verbose: true,
  strict: true,
});
