import { cn } from '@/lib/utils';
import { useFocused, useSelected } from 'platejs/react';
import React from 'react';

export const PlaceholderContainer = ({ children }: { children: React.ReactNode }) => {
  const focused = useFocused();
  const selected = useSelected();
  return (
    <div
      className={cn(
        'bg-gray-light/30 flex h-32 w-full items-center justify-center overflow-hidden rounded border-2 border-dashed border-gray-300',
        focused && selected && 'ring-ring ring-2 ring-offset-2'
      )}>
      {children}
    </div>
  );
};
