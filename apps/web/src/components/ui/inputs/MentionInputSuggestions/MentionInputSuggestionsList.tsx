import { Command } from 'cmdk';
import type React from 'react';
import { cn } from '@/lib/utils';

interface MentionInputSuggestionsListProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  show?: boolean;
}

export const MentionInputSuggestionsList = ({
  className,
  style,
  children,
  show = true,
}: MentionInputSuggestionsListProps) => {
  if (!show) return null;

  return (
    <Command.List className={cn('px-3', className)} style={style}>
      {children}
    </Command.List>
  );
};
