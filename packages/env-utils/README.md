# @buster/env-utils

Shared utilities for environment variable validation across the monorepo.

## Overview

This package provides utilities to:
1. Load environment variables from the root `.env` file
2. Validate required environment variables
3. Skip validation in CI/Docker/Production environments

## Usage

### In your package's validate-env.js script:

```javascript
#!/usr/bin/env node

import { loadRootEnv, validateEnv } from '@buster/env-utils';

// Load environment variables from root .env file
loadRootEnv();

// Define required environment variables for this package
const requiredEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  API_KEY: process.env.API_KEY,
  // Add your required variables here
};

// Validate environment variables
const { hasErrors } = validateEnv(requiredEnv);

if (hasErrors) {
  process.exit(1);
}
```

### Adding env-utils to your package:

1. Add the dependency to your package.json:
```json
{
  "dependencies": {
    "@buster/env-utils": "workspace:*"
  }
}
```

2. Update your validate-env.js script as shown above

3. Make sure your required environment variables are defined in the root `.env` file

## Migration Guide

To migrate an existing package to use the centralized env system:

1. Remove any local `.env` files from your package
2. Add `@buster/env-utils` as a dependency
3. Update your `scripts/validate-env.js` to use the shared utilities
4. Move any package-specific env variables to the root `.env` file
5. Ensure all env variables are listed in the root `turbo.json` globalEnv array

## API

### `loadRootEnv()`
Loads environment variables from the root `.env` file.

### `validateEnv(requiredVars, options?)`
Validates that all required environment variables are set.

Parameters:
- `requiredVars`: Object mapping env var names to their values
- `options`: Optional configuration
  - `skipInCI`: Skip validation in CI (default: true)
  - `skipInProduction`: Skip validation in production (default: true)
  - `skipInDocker`: Skip validation in Docker builds (default: true)

Returns:
- `{ hasErrors: boolean, missingVariables: string[] }`