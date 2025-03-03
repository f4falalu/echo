import { cn } from '@/lib/classMerge';
import React from 'react';

export const TooltipTitle: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className={cn('border-b', 'px-3 py-1.5')}>
      <span className="text-foreground text-base font-medium">{title}</span>
    </div>
  );
};
