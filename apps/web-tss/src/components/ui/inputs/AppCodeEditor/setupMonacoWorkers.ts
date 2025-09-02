// // This file is only imported client-side, so worker imports won't be processed during SSR
// export const setupMonacoWorkers = async () => {
//   if (typeof window === 'undefined') return;

//   self.MonacoEnvironment = {
//     async getWorker(_, label) {
//       if (label === 'json') {
//         const { default: Worker } = await import(
//           'monaco-editor/esm/vs/language/json/json.worker?worker'
//         );
//         return new Worker();
//       }
//       if (label === 'yaml') {
//         // For YAML, we'll use the JSON worker as it provides similar functionality
//         const { default: Worker } = await import(
//           'monaco-editor/esm/vs/language/json/json.worker?worker'
//         );
//         return new Worker();
//       }
//       // Default to editorWorkerService for all other languages
//       const { default: Worker } = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
//       return new Worker();
//     },
//   };
// };
