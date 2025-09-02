import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { CircleSpinnerLoaderContainer } from '../../loaders/CircleSpinnerLoaderContainer';
import type { AppCodeEditorProps } from './AppCodeEditor';

const AppCodeEditor = lazy(() =>
  import('./AppCodeEditor').then((mod) => {
    return {
      default: mod.AppCodeEditor,
    };
  })
);

export const AppCodeEditorDynamic = (props: AppCodeEditorProps) => {
  return (
    <ClientOnly
      fallback={<CircleSpinnerLoaderContainer className="animate-in fade-in-0 duration-300" />}
    >
      <Suspense
        fallback={<CircleSpinnerLoaderContainer className="animate-in fade-in-0 duration-300" />}
      >
        <AppCodeEditor {...props} />
      </Suspense>
    </ClientOnly>
  );
};
