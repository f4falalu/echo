import { loadRootEnv, validateEnv } from '@buster/env-utils';

// Load environment variables from root .env file
loadRootEnv();

// Define required environment variables for this package
const requiredEnv = {
  // Client-side environment variables (VITE_ prefixed)
  VITE_PUBLIC_API2_URL: process.env.VITE_PUBLIC_API2_URL,
  VITE_PUBLIC_API_URL: process.env.VITE_PUBLIC_API_URL,
  VITE_PUBLIC_SUPABASE_ANON_KEY: process.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
  VITE_PUBLIC_SUPABASE_URL: process.env.VITE_PUBLIC_SUPABASE_URL,
  VITE_PUBLIC_URL: process.env.VITE_PUBLIC_URL,
};

// Validate environment variables
const { hasErrors } = validateEnv(requiredEnv, { skipInProduction: false, skipInCI: false, skipInDocker: false });

if (hasErrors) {
  process.exit(1);
}
