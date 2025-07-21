#!/usr/bin/env node

// This script uses the shared env-utils to validate environment variables
import { loadRootEnv, validateEnv } from '@buster/env-utils';

// Load environment variables from root .env file
loadRootEnv();

// Define required environment variables for this package
const requiredEnv = {
  RERANK_API_KEY: process.env.RERANK_API_KEY,
  RERANK_MODEL: process.env.RERANK_MODEL,
  RERANK_BASE_URL: process.env.RERANK_BASE_URL,
};

// Validate environment variables
const { hasErrors } = validateEnv(requiredEnv);

if (hasErrors) {
  process.exit(1);
}
