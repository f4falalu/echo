import { Command } from 'cmdk';
import type React from 'react';
import { cn } from '@/lib/utils';

export const BusterInputEmpty = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Command.Empty>) => {
  return (
    <Command.Empty
      className={cn('text-gray-light py-6 text-center text-base', props.className)}
      {...props}
    >
      {children}
    </Command.Empty>
  );
};
