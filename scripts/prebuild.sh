#!/bin/bash

# Skip env validation if SKIP_ENV_CHECK is set
if [ "$SKIP_ENV_CHECK" = "true" ]; then
  echo "Skipping environment validation (dry-run build)"
  exit 0
fi

# Otherwise run the validation script
tsx scripts/validate-env.ts