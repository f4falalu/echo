import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import viteTsConfigPaths from 'vite-tsconfig-paths';

const config = defineConfig(({ command, mode, isSsrBuild }) => {
  const isBuild = command === 'build';
  const isProduction = mode === 'production';
  const isTypecheck = process.argv.includes('--typecheck') || process.env.TYPECHECK === 'true';
  const useChecker = !process.env.VITEST && isBuild;
  const isLocalBuild = process.argv.includes('--local');

  return {
    server: { port: 3000 },
    ssr: {
      noExternal: isSsrBuild ? [] : undefined,
      external: isSsrBuild
        ? [
            '@tanstack/devtools',
            '@tanstack/react-devtools',
            '@tanstack/react-query-devtools',
            '@tanstack/react-router-devtools',
            'solid-js',
          ]
        : undefined,
    },
    plugins: [
      // this is the plugin that enables path aliases
      viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      tanstackStart({
        customViteReactPlugin: true,
        target: isLocalBuild ? 'bun' : 'cloudflare-module',
      }),
      viteReact(),
      useChecker
        ? checker({
            typescript: isTypecheck,
            biome: isProduction,
          })
        : undefined,
    ],
    build: {
      chunkSizeWarningLimit: 850,
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
      },
    },
  };
});

export default config;
