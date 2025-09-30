import { useCommandState } from 'cmdk';
import type React from 'react';
import { cn } from '@/lib/utils';

export const MentionInputSuggestionsSeparator = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const hasResults = useCommandState((x) => x.filtered.count) > 0;
  return (
    <div
      className={cn(
        'bg-border -mx-1 h-px my-1.5',
        // Hide if first child
        'first:hidden',
        // Hide if last child
        'last:hidden',
        // Hide if next sibling is another separator
        'has-[+[role="separator"]]:hidden',
        !hasResults && 'hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
