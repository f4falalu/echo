import React from 'react';
import { cn } from '@/lib/classMerge';

export const Pill: React.FC<React.ComponentProps<'div'>> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'bg-item-select text-gray-dark rounded-sm border px-1 py-0.5 text-xs',
        className
      )}
      {...props}>
      {children}
    </div>
  );
};
