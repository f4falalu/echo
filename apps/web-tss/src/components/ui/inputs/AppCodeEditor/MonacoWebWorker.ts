import { loader } from '@monaco-editor/react';
import { isServer } from '@/lib/window';

if (!isServer) {
  self.MonacoEnvironment = {
    async getWorker(_, label) {
      if (label === 'json') {
        const jsonWorker = await import('monaco-editor/esm/vs/language/json/json.worker?worker');
        return new jsonWorker.default();
      }
      if (label === 'yaml') {
        // For YAML, we'll use the JSON worker as it provides similar functionality
        const jsonWorker = await import('monaco-editor/esm/vs/language/json/json.worker?worker');
        return new jsonWorker.default();
      }
      // Default to editorWorkerService for all other languages
      const editorWorker = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
      return new editorWorker.default();
    },
  };

  const monaco = await import('monaco-editor');
  loader.config({ monaco: monaco.default });

  loader.init();
}
