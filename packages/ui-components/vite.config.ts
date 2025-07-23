import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
// @ts-ignore - TypeScript can't resolve .d.mts files properly
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Directories to exclude from entry points (type-only directories)
const EXCLUDED_DIRECTORIES = ['interfaces', 'types'];

// Function to recursively find all index.ts files in components
function findComponentEntries(dir: string, baseDir: string = dir): Record<string, string> {
  const entries: Record<string, string> = {};
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = resolve(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip excluded directories
      if (EXCLUDED_DIRECTORIES.includes(item)) {
        continue;
      }

      // Check if this directory has an index.ts file
      const indexPath = resolve(fullPath, 'index.ts');
      try {
        statSync(indexPath);
        // Create a relative path for the entry name
        const relativePath = fullPath.replace(`${baseDir}/`, '');
        entries[relativePath] = indexPath;
      } catch {
        // No index.ts, recurse into subdirectory
        Object.assign(entries, findComponentEntries(fullPath, baseDir));
      }
    }
  }

  return entries;
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Automatically resolve paths from tsconfig.json
    tsconfigPaths(),
  ],
  // No need for manual resolve.alias anymore!
  build: {
    lib: {
      entry: {
        // Find all component entries
        ...findComponentEntries(resolve(__dirname, 'src/components')),
        // Add other specific entries
        'hooks/index': resolve(__dirname, 'src/hooks/index.ts'),
        'lib/index': resolve(__dirname, 'src/lib/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => {
        // Keep the directory structure in the output
        return `${entryName}.js`;
      },
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        // Exclude test dependencies
        /\.test\./,
        /\.stories\./,
        /vitest/,
        /@testing-library/,
        /@storybook/,
      ],
      output: {
        // Ensure CSS is extracted
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css';
          return assetInfo.name ?? '';
        },
        // Use manual chunks for better control
        manualChunks: undefined,
        // Don't preserve modules since we're using multiple entries
        preserveModules: false,
        // Add globals for external dependencies (useful for UMD builds if needed later)
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime',
        },
      },
    },
    // Target modern browsers
    target: 'es2020',
    sourcemap: true,
    // Ensure TypeScript declarations are generated
    emptyOutDir: true,
    // Optimize CSS
    cssCodeSplit: false,
    cssMinify: true,
    // Minimize bundle size
    minify: 'esbuild',
  },
  esbuild: {
    // Remove console logs in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Target modern JavaScript
    target: 'es2020',
  },
  // Optimize dependencies
  optimizeDeps: {
    exclude: ['@buster/ui-components'],
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
});
