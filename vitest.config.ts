import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/server-shared',
      'packages/ai',
      'packages/access-controls',
      'packages/data-source',
      'packages/database',
      'packages/rerank',
      'packages/slack',
      'packages/stored-values',
      'packages/supabase',
      'packages/test-utils',
      'packages/web-tools',
      'apps/server',
      'apps/trigger',
      'apps/web',
    ],
  },
});
