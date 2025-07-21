#!/usr/bin/env node

// This script uses the shared env-utils to validate environment variables
import { loadRootEnv, validateEnv } from '@buster/env-utils';

// Load environment variables from root .env file
loadRootEnv();

// Define required environment variables for this package
const requiredEnv = {
  SERVER_PORT: process.env.SERVER_PORT,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ELECTRIC_PROXY_URL: process.env.ELECTRIC_PROXY_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
};

// Conditionally validate Slack environment variables if integration is enabled
const conditionalEnv = {};
if (process.env.SLACK_INTEGRATION_ENABLED === 'true') {
  conditionalEnv.SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
  conditionalEnv.SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
  conditionalEnv.SLACK_APP_SUPPORT_URL = process.env.SLACK_APP_SUPPORT_URL;
  conditionalEnv.SERVER_URL = process.env.SERVER_URL;
}

// Combine required and conditional environment variables
const allRequiredEnv = { ...requiredEnv, ...conditionalEnv };

// Validate environment variables
const { hasErrors } = validateEnv(allRequiredEnv);

if (hasErrors) {
  process.exit(1);
}
