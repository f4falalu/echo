import React from 'react';
import { ApartmentBuilding } from '@/components/ui/icons/NucleoIconFilled';
import { cn } from '@/lib/classMerge';

export const WorkspaceAvatar: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div
      className={cn(
        'text-md flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600',
        className
      )}>
      <ApartmentBuilding />
    </div>
  );
};
