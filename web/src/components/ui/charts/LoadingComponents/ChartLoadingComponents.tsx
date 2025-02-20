'use client';

import { ShimmerText, Text } from '@/components/ui';
import React from 'react';

export const PreparingYourRequestLoader: React.FC<{
  className?: string;
  text?: string;
  error?: string | null;
  useShimmer?: boolean;
}> = ({ className = '', text = 'Processing your request...', error, useShimmer = true }) => {
  return (
    <div className={`flex h-full w-full items-center justify-center space-x-1.5 ${className}`}>
      {error || useShimmer === false ? (
        <Text type="tertiary" className="flex items-center text-center">
          {/* {!!error && <AppMaterialIcons icon="error" className="mr-1" />} */}
          {error || text}
        </Text>
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
      <Text type="tertiary" className={`${className}`}>
        {noDataText}
      </Text>
    </div>
  );
};
