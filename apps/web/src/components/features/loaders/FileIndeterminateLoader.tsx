import type React from 'react';
import { forwardRef } from 'react';
import { IndeterminateLinearLoader } from '@/components/ui/loaders';

export const FileIndeterminateLoader = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(function FileIndeterminateLoader(props, ref) {
  return (
    <div ref={ref} className="relative z-10 h-0 overflow-visible" {...props}>
      <IndeterminateLinearLoader
        className="absolute top-0 left-0 w-full"
        trackColor="transparent"
      />
    </div>
  );
});
