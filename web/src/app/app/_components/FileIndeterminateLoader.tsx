import { IndeterminateLinearLoader } from '@/components/loaders';
import React from 'react';

export const FileIndeterminateLoader: React.FC = () => {
  return (
    <div className="relative z-10 h-0 overflow-visible">
      <IndeterminateLinearLoader className="absolute left-0 top-0 w-full" />
    </div>
  );
};
