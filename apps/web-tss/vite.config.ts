import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import viteTsConfigPaths from 'vite-tsconfig-paths';

const config = defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  const isProduction = mode === 'production';
  const isTypecheck = process.argv.includes('--typecheck') || process.env.TYPECHECK === 'true';
  const useChecker = !process.env.VITEST && isBuild;
  const isLocalBuild = process.env.VITE_PUBLIC_API2_URL?.includes('127.0.0.1');
  console.log('isLocalBuild', isLocalBuild, process.env.VITE_PUBLIC_API2_URL);

  return {
    server: { port: 3000 },
    ssr: {
      // Exclude Monaco Editor and related from SSR bundle
      external: (id) => {
        // Monaco Editor and related
        if (
          id.includes('monaco-editor') ||
          id.includes('@monaco-editor') ||
          id.includes('setupMonacoWorkers')
        ) {
          return true;
        }
        // TanStack devtools (now handled via dynamic imports, but keep basic exclusions)
        if (id.includes('@tanstack/devtools')) {
          return true;
        }

        return false;
      },
      // Exclude Monaco Editor workers specifically
      noExternal: ['!**/monaco-editor/**/*worker*'],
    },
    plugins: [
      // this is the plugin that enables path aliases
      viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      tanstackStart({ customViteReactPlugin: true, target: 'cloudflare-module' }),
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
          // Exclude Monaco Editor from server-side bundle (Cloudflare Workers can't handle it)
          if (id.includes('monaco-editor') || id.includes('@monaco-editor')) {
            return true;
          }
          // Exclude Monaco worker setup file from SSR
          if (id.includes('setupMonacoWorkers')) {
            return true;
          }
          // Don't externalize React and React DOM - let them be bundled
          return false;
        },
        output: {
          // Force lodash and lodash-es into a dedicated vendor chunk
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
