import { Command, useCommandState } from 'cmdk';
import type React from 'react';
import { cn } from '@/lib/utils';

export const MentionInputSuggestionsSeparator = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Command.Separator>) => {
  const hasResults = useCommandState((x) => x);
  console.log(hasResults);
  return (
    <Command.Separator className={cn('bg-border -mx-1 h-px my-1.5', props.className)} {...props}>
      {children}
    </Command.Separator>
  );
};
