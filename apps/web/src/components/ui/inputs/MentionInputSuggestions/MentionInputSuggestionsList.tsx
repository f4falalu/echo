import { Command } from 'cmdk';
import type React from 'react';

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
    <Command.List className={className} style={style}>
      {children}
    </Command.List>
  );
};
