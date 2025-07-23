import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        // Preserve the directory structure for better tree-shaking
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
    sourcemap: true,
    // Ensure TypeScript declarations are generated
    emptyOutDir: false,
  },
});
