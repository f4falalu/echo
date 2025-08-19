import { lazy, Suspense } from 'react';
import { CircleSpinnerLoaderContainer } from '../../loaders/CircleSpinnerLoaderContainer';

const Editor = lazy(() => import('@monaco-editor/react').then((m) => ({ default: m.Editor })));

export const AppCodeEditorDynamic = () => {
  return (
    <Suspense
      fallback={<CircleSpinnerLoaderContainer className="animate-in fade-in-0 duration-300" />}
    >
      <Editor />
    </Suspense>
  );
};
