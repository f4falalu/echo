import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import viteTsConfigPaths from 'vite-tsconfig-paths';

const config = defineConfig({
  server: { port: 3000 },
  plugins: [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart({ customViteReactPlugin: true }),
    viteReact(),
    // Custom plugin to exclude test and stories files in dev mode
    {
      name: 'exclude-test-stories',
      resolveId(id) {
        // Exclude .test and .stories files from being resolved
        if (/\.(test|stories)\.(js|ts|jsx|tsx)$/.test(id)) {
          return { id, external: true };
        }
        return null;
      },
    },
    !process.env.VITEST
      ? checker({
          typescript: true,
          biome: true,
        })
      : undefined,
  ],
  build: {
    rollupOptions: {
      // Exclude test and stories files from build
      external: (id) => {
        // Exclude .test and .stories files
        return /\.(test|stories)\.(js|ts|jsx|tsx)$/.test(id);
      },
      output: {
        // Force lodash and lodash-es into a dedicated vendor chunk
        manualChunks(id) {
          // Skip chunking for test and stories files (they should be excluded anyway)
          if (/\.(test|stories)\.(js|ts|jsx|tsx)$/.test(id)) {
            return;
          }

          if (id.includes('node_modules/lodash')) {
            return 'vendor-lodash';
          }
          if (id.includes('node_modules/lodash-es')) {
            return 'vendor-lodash';
          }
          // Move supabase modules to their own chunk
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }

          if (id.includes('components/ui/icons')) {
            return 'vendor-icons';
          }

          if (id.includes('components/ui')) {
            return 'vendor-ui';
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
});

export default config;
