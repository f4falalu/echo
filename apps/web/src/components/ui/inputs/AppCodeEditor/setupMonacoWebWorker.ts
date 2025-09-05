// Import workers as URLs using Vite's ?worker&url syntax
import editorWorkerUrl from 'monaco-editor/esm/vs/editor/editor.worker?worker&url';
import jsonWorkerUrl from 'monaco-editor/esm/vs/language/json/json.worker?worker&url';
import yamlWorkerUrl from 'monaco-yaml/yaml.worker?worker&url';
import { isServer } from '@/lib/window';

export const setupMonacoWebWorker = (): void => {
  if (!isServer) {
    window.MonacoEnvironment = {
      getWorker(_moduleId, label) {
        switch (label) {
          case 'editorWorkerService':
            return new Worker(editorWorkerUrl);
          case 'json':
            return new Worker(jsonWorkerUrl);
          case 'yaml':
            return new Worker(yamlWorkerUrl);
          default:
            throw new Error(`Unknown label ${label}`);
        }
      },
    };
  }
};
