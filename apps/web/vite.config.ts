import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import viteTsConfigPaths from 'vite-tsconfig-paths';

const config = defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  const isProduction = mode === 'production' || mode === 'staging';
  const isTypecheck = process.argv.includes('--typecheck') || process.env.TYPECHECK === 'true';
  const useChecker = !process.env.VITEST && isBuild;
  const isLocalBuild = process.argv.includes('--local') || mode === 'development';
  const target = isLocalBuild ? ('bun' as const) : ('vercel' as const);

  // Generate a unique build ID for cache busting after deployments
  const buildId = `build:${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || process.env.BUILD_ID || Date.now().toString()}`;
  const buildAt = new Date().toISOString();

  return {
    server: { port: 3000 },
    define: {
      // Make the build ID available to the app for version tracking
      'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
      'import.meta.env.VITE_BUILD_AT': JSON.stringify(buildAt),
    },
    plugins: [
      // this is the plugin that enables path aliases
      viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      tanstackStart({
        customViteReactPlugin: true,
        target,
      }),
      viteReact(),
      useChecker
        ? checker({
            typescript: isTypecheck,
            biome: isProduction,
          })
        : undefined,
    ],
    worker: { format: 'es' },
    build: {
      chunkSizeWarningLimit: 1250,
      minify: isProduction ? 'esbuild' : false,
      reportCompressedSize: false, // Disable gzip size reporting to speed up build
      rollupOptions: {
        // Exclude test and stories files from build
        external: (id) => {
          // Exclude .test and .stories files
          if (/\.(test|stories)\.(js|ts|jsx|tsx)$/.test(id)) {
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
        // Optimize tree-shaking for CloudFlare
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },
    },
  };
});

export default config;
