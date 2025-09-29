import { Command } from 'cmdk';
import type React from 'react';
import { cn } from '@/lib/utils';

export const MentionInputSuggestionsSeparator = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Command.Separator>) => {
  return (
    <Command.Separator className={cn('bg-border -mx-1 h-px', props.className)} {...props}>
      {children}
    </Command.Separator>
  );
};
