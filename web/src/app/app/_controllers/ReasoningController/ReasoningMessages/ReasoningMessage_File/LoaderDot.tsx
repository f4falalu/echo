import { TextPulseLoader } from '@/components/loaders';
import React from 'react';

export const LoaderDot = React.memo(() => {
  return (
    <div className="-mt-0.5 pl-1">
      <TextPulseLoader />
    </div>
  );
});

LoaderDot.displayName = 'LoaderDot';
