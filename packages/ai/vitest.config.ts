import { baseConfig } from '@buster/vitest-config';
import { defineConfig } from 'vitest/config';

export default defineConfig(async (env) => {
  const base = await baseConfig(env);

  return {
    ...base,
    test: {
      ...base.test,
      // Run tests sequentially for streaming tests to avoid memory issues
      pool: 'forks',
      poolOptions: {
        forks: {
          maxForks: 1,
          minForks: 1,
          singleFork: true,
        },
      },
      // Increase timeout for streaming tests
      testTimeout: 30000,
      // Isolate tests that use ReadableStreams
      isolate: true,
    },
  };
});
