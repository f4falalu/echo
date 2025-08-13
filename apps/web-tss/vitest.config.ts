/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [tsconfigPaths({
    root: resolve(__dirname),
    projects: [resolve(__dirname, 'tsconfig.json')]
  }) as unknown as Plugin],
  esbuild: {
    jsx: 'automatic'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // For React components
    setupFiles: ['./vitest.setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: process.env.CI ? 1 : 8,
        minForks: process.env.CI ? 1 : 8
      }
    },
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/playwright-tests/**', '**/coverage/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['coverage/**', 'dist/**', '**/node_modules/**', '**/[.]**', 'packages/*/test{,s}/**', '**/*.d.ts', '**/virtual:*', '**/__x00__*', '**/\x00*', 'cypress/**', 'test{,s}/**', 'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}', '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}', '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}', '**/tests/**', '**/__tests__/**', '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}', '**/vitest.{workspace,projects}.[jt]s?(on)', '**/vitest.config.[jt]s', '**/playwright.config.[jt]s', '**/.storybook/**', '**/storybook-static/**']
    },
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: 'playwright',
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    }]
  },
  css: {
    postcss: {
      plugins: []
    }
  }
});