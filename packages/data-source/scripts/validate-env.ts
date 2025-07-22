#!/usr/bin/env node

// This script uses the shared env-utils to validate environment variables
import { loadRootEnv, validateEnv } from '@buster/env-utils';

// Load environment variables from root .env file
loadRootEnv();

// Define required environment variables for this package
const requiredEnv = {
  // Currently no specific env vars required for data-source package
};

// Validate environment variables
const { hasErrors } = validateEnv(requiredEnv);

if (hasErrors) {
  process.exit(1);
}
