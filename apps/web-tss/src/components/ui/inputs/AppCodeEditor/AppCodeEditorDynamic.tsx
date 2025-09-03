import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import type { AppCodeEditorProps } from './AppCodeEditor';
import { LoadingCodeEditor } from './LoadingCodeEditor';

const AppCodeEditor = lazy(() =>
  import('./AppCodeEditor').then((mod) => {
    return {
      default: mod.AppCodeEditor,
    };
  })
);

export const AppCodeEditorDynamic = (props: AppCodeEditorProps) => {
  return (
    <ClientOnly fallback={<LoadingCodeEditor />}>
      <Suspense fallback={<LoadingCodeEditor />}>
        <AppCodeEditor {...props} />
      </Suspense>
    </ClientOnly>
  );
};
