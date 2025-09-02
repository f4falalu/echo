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
    plugins: [
      // this is the plugin that enables path aliases
      viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      tanstackStart({ customViteReactPlugin: true, target: 'cloudflare-module' }),
      viteReact(),
    ],
  };
});

export default config;
