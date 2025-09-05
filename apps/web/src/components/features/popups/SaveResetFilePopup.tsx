import React, { lazy, Suspense } from 'react';
import type { SaveResetFilePopupProps } from './SaveResetFilePopupBase';

const SaveResetFilePopupBase = lazy(() =>
  import('./SaveResetFilePopupBase').then((mod) => ({ default: mod.SaveResetFilePopupBase }))
);

export const SaveResetFilePopup = (props: SaveResetFilePopupProps) => {
  return (
    <Suspense fallback={null}>
      <SaveResetFilePopupBase {...props} />
    </Suspense>
  );
};
