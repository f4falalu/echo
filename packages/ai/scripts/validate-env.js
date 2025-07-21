#!/usr/bin/env node

// This script uses the shared env-utils to validate environment variables
import { loadRootEnv, validateEnv } from '@buster/env-utils';

// Load environment variables from root .env file
loadRootEnv();

// Define required environment variables for this package
const requiredEnv = {
  BRAINTRUST_KEY: process.env.BRAINTRUST_KEY,
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ENVIRONMENT: process.env.ENVIRONMENT,
  DATABASE_URL: process.env.DATABASE_URL,
};

// Validate environment variables
const { hasErrors } = validateEnv(requiredEnv);

if (hasErrors) {
  process.exit(1);
}
