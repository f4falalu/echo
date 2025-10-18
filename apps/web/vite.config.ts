import { execSync } from 'node:child_process';
import tailwindcss from '@tailwindcss/vite';
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import tsConfigPaths from 'vite-tsconfig-paths';

const commitHash = execSync('git rev-parse --short HEAD').toString().trim();

const config = defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  const isProduction = mode === 'production' || mode === 'staging';
  const isTypecheck = process.argv.includes('--typecheck') || process.env.TYPECHECK === 'true';
  const useChecker = !process.env.VITEST && isBuild;
  const isVercelBuild = process.env.VERCEL === '1' || process.env.CI === '1';
  const isNetlifyBuild = process.env.NETLIFY === 'true';

  // Generate a unique version identifier for both build tracking and asset versioning
  const buildId =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
    process.env.BUILD_ID ||
    (isProduction ? commitHash : 'dev');
  const buildAt = new Date().toString();

  // Set the base URL for assets with versioning in production
  const base = '/';

  return {
    base,
    server: { port: 3000 },
    define: {
      'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
      'import.meta.env.VITE_BUILD_AT': JSON.stringify(buildAt),
    },
    optimizeDeps: {
      exclude: ['playwright-core', 'chromium-bidi'],
    },
    plugins: [
      // this is the plugin that enables path aliases
      tsConfigPaths({ projects: ['./tsconfig.json'] }),
      useChecker
        ? checker({
            typescript: isTypecheck,
            biome: isProduction,
          })
        : undefined,
      tailwindcss(),
      tanstackStart(),
      nitroV2Plugin({
        preset: isVercelBuild ? 'vercel' : isNetlifyBuild ? 'static' : 'bun',
      }),
      viteReact(),
    ],
    worker: { format: 'es' },
    build: {
      chunkSizeWarningLimit: 1500,
      reportCompressedSize: false, // Disable gzip size reporting to speed up build
      rollupOptions: {
        // Exclude test and stories files from build
        external: (id) => {
          // Exclude .test and .stories files
          if (/\.(test|stories)\.(js|ts|jsx|tsx)$/.test(id)) {
            return true;
          }
          // Exclude playwright-core (Node.js-only package)
          if (id.includes('playwright-core')) {
            return true;
          }
          // Don't externalize React and React DOM - let them be bundled
          return false;
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/lodash')) {
              return 'vendor-lodash';
            }
            if (id.includes('node_modules/lodash-es')) {
              return 'vendor-lodash';
            }
            // // Move supabase modules to their own chunk
            if (id.includes('node_modules/@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('zod')) {
              return 'vendor-zod';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
          },
        },
      },
    },
  };
});

export default config;
