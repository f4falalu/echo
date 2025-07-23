import { cn } from '@/lib/classMerge';
import type React from 'react';

import TriangleWarning from '../OtherComponents/TriangleWarning';
import { DOWNSIZE_SAMPLE_THRESHOLD } from '../config';

export const DownsampleAlert: React.FC<{ isDownsampled: boolean }> = ({ isDownsampled }) => {
  if (!isDownsampled) {
    return null;
  }

  return (
    <div className='absolute right-0 bottom-0.5 left-0 w-full px-1 pb-0'>
      <div
        className={cn(
          'flex h-6 w-full items-center justify-center space-x-1 rounded-sm border px-1.5 text-sm shadow',
          'border-gray-100 bg-white text-gray-500 transition-all duration-200',
          'dark:border-yellow-500/30 dark:bg-yellow-900/10 dark:text-yellow-300'
        )}
        title={`This chart has been downsampled to ${DOWNSIZE_SAMPLE_THRESHOLD} data points to improve performance. Click the results tab or download the data to see all points.`}
      >
        <TriangleWarning strokewidth={1.2} />
        <span>Chart downsampled for performance</span>
      </div>
    </div>
  );
};

DownsampleAlert.displayName = 'DownsampleAlert';
