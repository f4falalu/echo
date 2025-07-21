#!/usr/bin/env node

// Load environment variables from .env file
import { config } from 'dotenv';
config();

// Build-time environment validation

console.log('🔍 Validating environment variables...');

// Skip validation during Docker builds (environment variables are only available at runtime)
if (process.env.DOCKER_BUILD || process.env.CI || process.env.NODE_ENV === 'production') {
  console.log(
    '🐳 Docker/CI build detected - skipping environment validation (will validate at runtime)'
  );
  process.exit(0);
}

const env = {};

let hasErrors = false;

for (const [envKey, value] of Object.entries(env)) {
  if (!value) {
    console.error(`❌ Missing required environment variable: ${envKey}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${envKey} is set`);
  }
}

if (hasErrors) {
  console.error('');
  console.error('❌ Build cannot continue with missing environment variables.');
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

console.log('✅ All required environment variables are present');
