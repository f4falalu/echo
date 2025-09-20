import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import * as fs from 'fs';

// Load specific .env file
config({ path: '../../.env' }); // or '.env.development', '.env.production', etc.

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// Check if we have a certificate file specified
const certPath = process.env.DATABASE_SSL_CERT;
const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

// Configure SSL based on environment
let sslConfig: any = undefined;
if (!isLocalhost) {
  if (certPath && fs.existsSync(certPath)) {
    // Use the certificate if available
    sslConfig = {
      ca: fs.readFileSync(certPath),
      rejectUnauthorized: true, // With a proper cert, we can validate
    };
    console.log('Using SSL certificate from:', certPath);
  } else {
    // Fallback to allowing self-signed certificates
    sslConfig = {
      rejectUnauthorized: false,
    };
    console.log('SSL certificate not found, allowing self-signed certificates');
  }
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString || '',
    ...(sslConfig && { ssl: sslConfig }),
  },
  verbose: true,
  strict: true,
});
