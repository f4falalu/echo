'use client';

import React, { useRef } from 'react';
import { ChartWrapperProvider } from './chartHooks';
import { useSize } from '@/hooks';
import { cn } from '@/lib/classMerge';

export const BusterChartWrapper = React.memo<{
  children: React.ReactNode;
  id: string | undefined;
  className: string | undefined;
  loading: boolean;
}>(({ children, id, className, loading }) => {
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref, 25);
  const width = size?.width ?? 400;

  return (
    <ChartWrapperProvider width={width}>
      <div
        ref={ref}
        id={id}
        className={cn(
          className,
          'flex h-full w-full flex-col',
          'transition duration-300',
          loading ? 'bg-transparent!' : undefined,
          'overflow-hidden'
        )}>
        {children}
      </div>
    </ChartWrapperProvider>
  );
});

BusterChartWrapper.displayName = 'BusterChartWrapper';
