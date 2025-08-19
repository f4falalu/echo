#!/usr/bin/env node

// This script uses the shared env-utils to validate environment variables
import { loadRootEnv, validateEnv } from '@buster/env-utils';

// Load environment variables from root .env file
loadRootEnv();

// Define required environment variables for this package
// Note: These are only required at runtime when using the GitHub integration
// Making them optional for build time to allow packages to be built without GitHub setup
const requiredEnv = {
  // NODE_ENV is optional - will default to 'development' if not set
  // GitHub variables are optional at build time but required at runtime
};

// Validate environment variables
const { hasErrors } = validateEnv(requiredEnv);

if (hasErrors) {
  process.exit(1);
}
