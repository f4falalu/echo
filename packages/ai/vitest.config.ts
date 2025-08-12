import fs from 'node:fs';
import path from 'node:path';
import { baseConfig } from '@buster/vitest-config';
import { defineConfig } from 'vitest/config';

// Custom plugin to handle .txt file imports
const textFilePlugin = () => ({
  name: 'text-file-plugin',
  transform(code: string, id: string) {
    if (id.endsWith('.txt')) {
      const content = fs.readFileSync(id, 'utf-8');
      return {
        code: `export default ${JSON.stringify(content)};`,
        map: null,
      };
    }
  },
});

export default defineConfig(async (env) => {
  const base = await baseConfig(env);

  return {
    ...base,
    plugins: [...(base.plugins || []), textFilePlugin()],
    test: {
      ...base.test,
      // Increase timeout for streaming tests
      testTimeout: 30000,
    },
  };
});
