'use client';

import { ShimmerText } from '@/components/ui/text/ShimmerText';
import React from 'react';
import { cn } from '@/lib/utils';

export const PreparingYourRequestLoader: React.FC<{
  className?: string;
  text?: string;
  error?: string | null;
  useShimmer?: boolean;
}> = ({ className = '', text = 'Processing your request...', error, useShimmer = true }) => {
  return (
    <div className={`flex h-full w-full items-center justify-center space-x-1.5 ${className}`}>
      {error || useShimmer === false ? (
        <span className="text-text-tertiary flex items-center text-center">{error || text}</span>
      ) : (
        <ShimmerText text={text} />
      )}
    </div>
  );
};

export const NoChartData: React.FC<{
  noDataText?: string;
  className?: string;
}> = ({ className = '', noDataText = 'The query ran successfully but didn’t return any data' }) => {
  return (
    <div className={`flex h-full w-full items-center justify-center ${className}`}>
      <span className={cn('text-text-tertiary', className)}>{noDataText}</span>
    </div>
  );
};
