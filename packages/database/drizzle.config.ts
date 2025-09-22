import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load specific .env file
config({ path: '../../.env' }); // or '.env.development', '.env.production', etc.

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// Disable SSL for local development
const isDevelopment = process.env.ENVIRONMENT === 'development' || process.env.NODE_ENV === 'development';

// Append sslmode=disable for local development if not already present
const dbUrl = isDevelopment && !connectionString.includes('sslmode=') 
  ? `${connectionString}?sslmode=disable`
  : connectionString;

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl || '',
  },
  verbose: true,
  strict: true,
});
