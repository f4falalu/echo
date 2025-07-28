import { baseConfig } from '@buster/vitest-config';
import { defineConfig } from 'vitest/config';

export default defineConfig(async (env) => {
  const base = await baseConfig(env);

  return {
    ...base,
    test: {
      ...base.test,
      // Increase timeout for streaming tests
      testTimeout: 30000,
    },
  };
});
